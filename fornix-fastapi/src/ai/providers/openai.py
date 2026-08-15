"""Native OpenAI Responses API adapter.

OpenAI SDK objects are deliberately translated at this boundary and never escape
into application code.
"""

from __future__ import annotations

import asyncio
import base64
from collections.abc import AsyncIterator, Mapping
from typing import Any

import openai
from pydantic import BaseModel, ValidationError

from ..capabilities import ProviderCapabilities
from ..content import ContentPart, ImagePart, TextPart, ToolCallPart, ToolResultPart
from ..errors import (
    AIProviderError,
    AuthenticationError,
    InvalidProviderRequestError,
    MalformedProviderResponseError,
    ProviderTimeoutError,
    ProviderUnavailableError,
    RateLimitError,
)
from ..events import (
    AIStreamEvent,
    Completed,
    Refused,
    StructuredDelta,
    TextDelta,
    ToolArgumentsDelta,
    ToolCallStarted,
    UsageReported,
)
from ..models import (
    AIRequest,
    AIResponse,
    FinishReason,
    ModelProfile,
    ProviderName,
    Role,
    TokenUsage,
    ToolCall,
)
from ..provider import normalize_model_map, resolve_model
from ..tools import ToolChoiceMode


class OpenAIProvider:
    """Provider-neutral wrapper around ``AsyncOpenAI.responses``."""

    name = ProviderName.OPENAI
    capabilities = ProviderCapabilities(
        vision=True,
        streaming=True,
        structured_output=True,
        structured_streaming=True,
        function_calling=True,
    )

    def __init__(
        self,
        *,
        api_key: str | None,
        models: Mapping[ModelProfile | str, str],
        timeout: float = 60.0,
        client: Any | None = None,
    ) -> None:
        self._models = normalize_model_map(models)
        self._client = client or openai.AsyncOpenAI(api_key=api_key, timeout=timeout)

    async def generate(self, request: AIRequest) -> AIResponse:
        self.capabilities.ensure_request_supported(
            request, provider=self.name, streaming=False
        )
        try:
            arguments = self._request_arguments(request)
            if request.response_schema is not None:
                response = await self._client.responses.parse(
                    **arguments,
                    text_format=request.response_schema,
                )
            else:
                response = await self._client.responses.create(**arguments)
            return self._normalize_response(response, request)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            raise self._normalize_error(exc) from exc

    async def stream(self, request: AIRequest) -> AsyncIterator[AIStreamEvent]:
        self.capabilities.ensure_request_supported(
            request, provider=self.name, streaming=True
        )
        call_ids_by_item: dict[str, str] = {}
        try:
            arguments = self._request_arguments(request)
            if request.response_schema is not None:
                arguments["text_format"] = request.response_schema

            async with self._client.responses.stream(**arguments) as stream:
                async for event in stream:
                    event_type = getattr(event, "type", "")
                    if event_type == "response.output_text.delta":
                        delta = getattr(event, "delta", "")
                        if request.response_schema is not None:
                            yield StructuredDelta(json_fragment=delta)
                        else:
                            yield TextDelta(text=delta)
                    elif event_type == "response.output_item.added":
                        item = getattr(event, "item", None)
                        if getattr(item, "type", None) == "function_call":
                            item_id = getattr(item, "id", "")
                            call_id = getattr(item, "call_id", "") or item_id
                            if item_id:
                                call_ids_by_item[item_id] = call_id
                            yield ToolCallStarted(
                                call_id=call_id,
                                name=getattr(item, "name", ""),
                            )
                    elif event_type == "response.function_call_arguments.delta":
                        item_id = getattr(event, "item_id", "")
                        yield ToolArgumentsDelta(
                            call_id=call_ids_by_item.get(item_id, item_id),
                            fragment=getattr(event, "delta", ""),
                        )
                    elif event_type == "response.refusal.done":
                        yield Refused(reason=getattr(event, "refusal", "refused"))
                    elif event_type == "error":
                        error = getattr(event, "error", event)
                        raise ProviderUnavailableError(
                            "OpenAI streaming request failed",
                            provider=self.name,
                            retryable=True,
                            provider_request_id=getattr(event, "request_id", None),
                            cause=error if isinstance(error, BaseException) else None,
                        )

                final_response = await stream.get_final_response()

            response = self._normalize_response(final_response, request)
            if response.usage is not None:
                yield UsageReported(usage=response.usage)
            yield Completed(response=response)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            raise self._normalize_error(exc) from exc

    def _request_arguments(self, request: AIRequest) -> dict[str, Any]:
        arguments: dict[str, Any] = {
            "model": resolve_model(self._models, request.profile),
            "input": self._input(request),
            "store": False,
            "metadata": {"request_id": request.request_id},
        }
        instructions = self._instructions(request)
        if instructions:
            arguments["instructions"] = instructions
        if request.temperature is not None:
            arguments["temperature"] = request.temperature
        if request.max_output_tokens is not None:
            arguments["max_output_tokens"] = request.max_output_tokens
        if request.tools:
            arguments["tools"] = [
                {
                    "type": "function",
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                    "strict": True,
                }
                for tool in request.tools
            ]
            arguments["tool_choice"] = self._tool_choice(request)
        return arguments

    @staticmethod
    def _instructions(request: AIRequest) -> str:
        return "\n\n".join(
            part.text
            for message in request.messages
            if message.role is Role.SYSTEM
            for part in message.content
            if isinstance(part, TextPart)
        )

    @staticmethod
    def _input(request: AIRequest) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for message in request.messages:
            if message.role is Role.SYSTEM:
                continue

            message_content: list[dict[str, Any]] = []

            def flush_message_content() -> None:
                if not message_content:
                    return
                role = (
                    "assistant" if message.role is Role.ASSISTANT else "user"
                )
                items.append(
                    {"type": "message", "role": role, "content": message_content[:]}
                )
                message_content.clear()

            for part in message.content:
                if isinstance(part, TextPart):
                    message_content.append({"type": "input_text", "text": part.text})
                elif isinstance(part, ImagePart):
                    encoded = base64.b64encode(part.data).decode("ascii")
                    message_content.append(
                        {
                            "type": "input_image",
                            "image_url": f"data:{part.mime_type};base64,{encoded}",
                            "detail": "auto",
                        }
                    )
                elif isinstance(part, ToolCallPart):
                    flush_message_content()
                    items.append(
                        {
                            "type": "function_call",
                            "call_id": part.call_id,
                            "name": part.name,
                            "arguments": part.arguments,
                        }
                    )
                elif isinstance(part, ToolResultPart):
                    flush_message_content()
                    items.append(
                        {
                            "type": "function_call_output",
                            "call_id": part.call_id,
                            "output": part.output,
                        }
                    )

            flush_message_content()
        return items

    @staticmethod
    def _tool_choice(request: AIRequest) -> str | dict[str, str]:
        choice = request.tool_choice
        if choice.mode is ToolChoiceMode.SPECIFIC:
            return {"type": "function", "name": choice.name or ""}
        return choice.mode.value

    def _normalize_response(self, response: Any, request: AIRequest) -> AIResponse:
        content: list[ContentPart] = []
        tool_calls: list[ToolCall] = []
        refused = False

        for item in getattr(response, "output", []) or []:
            item_type = getattr(item, "type", None)
            if item_type == "message":
                for part in getattr(item, "content", []) or []:
                    part_type = getattr(part, "type", None)
                    if part_type == "output_text" and getattr(part, "text", ""):
                        content.append(TextPart(text=part.text))
                    elif part_type == "refusal":
                        refused = True
            elif item_type == "function_call":
                tool_calls.append(
                    ToolCall(
                        call_id=getattr(item, "call_id", "")
                        or getattr(item, "id", ""),
                        name=getattr(item, "name", ""),
                        arguments=getattr(item, "arguments", "{}"),
                    )
                )

        finish_reason = self._finish_reason(response, tool_calls, refused)
        parsed = (
            self._parsed_output(response, request.response_schema)
            if finish_reason is FinishReason.COMPLETED
            else None
        )
        return AIResponse(
            provider=self.name,
            model=getattr(response, "model", "")
            or resolve_model(self._models, request.profile),
            content=content,
            parsed=parsed,
            tool_calls=tool_calls,
            finish_reason=finish_reason,
            usage=self._usage(getattr(response, "usage", None)),
            provider_request_id=getattr(response, "id", None),
            provider_metadata={"status": str(getattr(response, "status", ""))},
        )

    @staticmethod
    def _parsed_output(
        response: Any, schema: type[BaseModel] | None
    ) -> BaseModel | None:
        if schema is None:
            return None
        parsed = getattr(response, "output_parsed", None)
        if isinstance(parsed, schema):
            return parsed
        try:
            if parsed is not None:
                return schema.model_validate(parsed)
            return schema.model_validate_json(getattr(response, "output_text", ""))
        except (ValidationError, ValueError, TypeError) as exc:
            raise MalformedProviderResponseError(
                "OpenAI returned an invalid structured response",
                provider=ProviderName.OPENAI,
                cause=exc,
            ) from exc

    @staticmethod
    def _finish_reason(
        response: Any, tool_calls: list[ToolCall], refused: bool
    ) -> FinishReason:
        if tool_calls:
            return FinishReason.TOOL_CALL
        if refused:
            return FinishReason.REFUSED
        status = str(getattr(response, "status", ""))
        incomplete = getattr(response, "incomplete_details", None)
        reason = str(getattr(incomplete, "reason", ""))
        if status == "incomplete" and "max_output_tokens" in reason:
            return FinishReason.MAX_TOKENS
        if status == "completed":
            return FinishReason.COMPLETED
        return FinishReason.UNKNOWN

    @staticmethod
    def _usage(usage: Any) -> TokenUsage | None:
        if usage is None:
            return None
        input_tokens = int(getattr(usage, "input_tokens", 0) or 0)
        output_tokens = int(getattr(usage, "output_tokens", 0) or 0)
        total_tokens = int(
            getattr(usage, "total_tokens", input_tokens + output_tokens)
            or input_tokens + output_tokens
        )
        return TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )

    def _normalize_error(self, exc: Exception) -> AIProviderError:
        if isinstance(exc, AIProviderError):
            return exc
        request_id = getattr(exc, "request_id", None)
        common = {
            "provider": self.name,
            "provider_request_id": request_id,
            "cause": exc,
        }
        if isinstance(exc, openai.AuthenticationError):
            return AuthenticationError("OpenAI authentication failed", **common)
        if isinstance(exc, openai.RateLimitError):
            return RateLimitError(
                "OpenAI rate limit exceeded", retryable=True, **common
            )
        if isinstance(exc, openai.APITimeoutError):
            return ProviderTimeoutError(
                "OpenAI request timed out", retryable=True, **common
            )
        if isinstance(exc, openai.APIConnectionError):
            return ProviderUnavailableError(
                "OpenAI is unavailable", retryable=True, **common
            )
        if isinstance(exc, openai.APIStatusError) and exc.status_code >= 500:
            return ProviderUnavailableError(
                "OpenAI is unavailable", retryable=True, **common
            )
        return InvalidProviderRequestError("OpenAI request failed", **common)

"""Native Google Gen AI SDK adapter for Gemini."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator, Mapping
from typing import Any

from google import genai
from google.genai import errors as genai_errors
from pydantic import BaseModel, ValidationError

from ..capabilities import ProviderCapabilities
from ..content import ImagePart, TextPart, ToolCallPart, ToolResultPart
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


class GeminiProvider:
    """Provider-neutral wrapper around ``google.genai`` async models."""

    name = ProviderName.GEMINI
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
        if client is None:
            owner = genai.Client(
                api_key=api_key,
                http_options={"timeout": int(timeout * 1000)},
            )
            self._client = owner.aio
            self._client_owner = owner
        else:
            self._client = client
            self._client_owner = None

    async def generate(self, request: AIRequest) -> AIResponse:
        self.capabilities.ensure_request_supported(
            request, provider=self.name, streaming=False
        )
        try:
            response = await self._client.models.generate_content(
                model=resolve_model(self._models, request.profile),
                contents=self._contents(request),
                config=self._config(request),
            )
            return self._normalize_response(response, request)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            raise self._normalize_error(exc) from exc

    async def stream(self, request: AIRequest) -> AsyncIterator[AIStreamEvent]:
        self.capabilities.ensure_request_supported(
            request, provider=self.name, streaming=True
        )
        text_fragments: list[str] = []
        calls: dict[str, dict[str, str]] = {}
        usage: TokenUsage | None = None
        response_id: str | None = None
        model = resolve_model(self._models, request.profile)
        finish_reason = FinishReason.UNKNOWN
        refusal_reason: str | None = None

        try:
            stream = await self._client.models.generate_content_stream(
                model=model,
                contents=self._contents(request),
                config=self._config(request),
            )
            async for chunk in stream:
                response_id = getattr(chunk, "response_id", None) or response_id
                model = getattr(chunk, "model_version", None) or model
                chunk_usage = self._usage(getattr(chunk, "usage_metadata", None))
                if chunk_usage is not None:
                    usage = chunk_usage

                candidates = getattr(chunk, "candidates", None) or []
                for candidate_index, candidate in enumerate(candidates):
                    candidate_reason = self._candidate_finish_reason(candidate)
                    if candidate_reason is not FinishReason.UNKNOWN:
                        finish_reason = candidate_reason
                    if candidate_reason is FinishReason.SAFETY_BLOCKED:
                        refusal_reason = (
                            getattr(candidate, "finish_message", None)
                            or "Gemini blocked the response for safety reasons"
                        )

                    content = getattr(candidate, "content", None)
                    for part_index, part in enumerate(
                        getattr(content, "parts", None) or []
                    ):
                        fragment = getattr(part, "text", None)
                        if fragment:
                            text_fragments.append(fragment)
                            if request.response_schema is not None:
                                yield StructuredDelta(json_fragment=fragment)
                            else:
                                yield TextDelta(text=fragment)

                        function_call = getattr(part, "function_call", None)
                        if function_call is not None:
                            async for event in self._function_call_events(
                                function_call,
                                candidate_index=candidate_index,
                                part_index=part_index,
                                calls=calls,
                            ):
                                yield event

            if refusal_reason:
                yield Refused(reason=refusal_reason)
            if calls:
                finish_reason = FinishReason.TOOL_CALL
            elif finish_reason is FinishReason.UNKNOWN:
                finish_reason = FinishReason.COMPLETED

            response = self._stream_response(
                request=request,
                model=model,
                response_id=response_id,
                fragments=text_fragments,
                calls=calls,
                finish_reason=finish_reason,
                usage=usage,
            )
            if usage is not None:
                yield UsageReported(usage=usage)
            yield Completed(response=response)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            raise self._normalize_error(exc) from exc

    async def _function_call_events(
        self,
        function_call: Any,
        *,
        candidate_index: int,
        part_index: int,
        calls: dict[str, dict[str, str]],
    ) -> AsyncIterator[ToolCallStarted | ToolArgumentsDelta]:
        call_id = getattr(function_call, "id", None) or (
            f"gemini-call-{candidate_index}-{part_index}"
        )
        name = getattr(function_call, "name", None) or ""
        current = calls.get(call_id)
        if current is None:
            current = {"name": name, "arguments": ""}
            calls[call_id] = current
            yield ToolCallStarted(call_id=call_id, name=name)

        arguments = getattr(function_call, "args", None)
        if arguments is None:
            fragment = ""
        else:
            serialized = json.dumps(arguments, separators=(",", ":"), sort_keys=True)
            previous = current["arguments"]
            fragment = (
                serialized[len(previous) :]
                if serialized.startswith(previous)
                else serialized
            )
            current["arguments"] = serialized
        if fragment:
            yield ToolArgumentsDelta(call_id=call_id, fragment=fragment)

    def _config(self, request: AIRequest) -> dict[str, Any]:
        config: dict[str, Any] = {
            "automatic_function_calling": {"disable": True},
        }
        instructions = self._instructions(request)
        if instructions:
            config["system_instruction"] = instructions
        if request.temperature is not None:
            config["temperature"] = request.temperature
        if request.max_output_tokens is not None:
            config["max_output_tokens"] = request.max_output_tokens
        if request.response_schema is not None:
            config["response_mime_type"] = "application/json"
            config["response_schema"] = request.response_schema
        if request.tools:
            config["tools"] = [
                {
                    "function_declarations": [
                        {
                            "name": tool.name,
                            "description": tool.description,
                            "parameters_json_schema": tool.parameters,
                        }
                        for tool in request.tools
                    ]
                }
            ]
            config["tool_config"] = {
                "function_calling_config": self._function_calling_config(request)
            }
        return config

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
    def _contents(request: AIRequest) -> list[dict[str, Any]]:
        contents: list[dict[str, Any]] = []
        for message in request.messages:
            if message.role is Role.SYSTEM:
                continue
            parts: list[dict[str, Any]] = []
            for part in message.content:
                if isinstance(part, TextPart):
                    parts.append({"text": part.text})
                elif isinstance(part, ImagePart):
                    parts.append(
                        {
                            "inline_data": {
                                "mime_type": part.mime_type,
                                "data": part.data,
                            }
                        }
                    )
                elif isinstance(part, ToolCallPart):
                    function_call: dict[str, Any] = {
                        "name": part.name,
                        "args": part.arguments_dict,
                    }
                    if not part.call_id.startswith("gemini-call-"):
                        function_call["id"] = part.call_id
                    parts.append(
                        {
                            "function_call": function_call,
                        }
                    )
                elif isinstance(part, ToolResultPart):
                    response: dict[str, Any] = {"output": part.output}
                    if part.is_error:
                        response["error"] = True
                    function_response: dict[str, Any] = {
                        "name": part.name,
                        "response": response,
                    }
                    if not part.call_id.startswith("gemini-call-"):
                        function_response["id"] = part.call_id
                    parts.append(
                        {
                            "function_response": function_response,
                        }
                    )
            role = "model" if message.role is Role.ASSISTANT else "user"
            contents.append({"role": role, "parts": parts})
        return contents

    @staticmethod
    def _function_calling_config(request: AIRequest) -> dict[str, Any]:
        choice = request.tool_choice
        mode = {
            ToolChoiceMode.AUTO: "AUTO",
            ToolChoiceMode.REQUIRED: "ANY",
            ToolChoiceMode.NONE: "NONE",
            ToolChoiceMode.SPECIFIC: "ANY",
        }[choice.mode]
        config: dict[str, Any] = {"mode": mode}
        if choice.mode is ToolChoiceMode.SPECIFIC:
            config["allowed_function_names"] = [choice.name]
        return config

    def _normalize_response(self, response: Any, request: AIRequest) -> AIResponse:
        content: list[TextPart] = []
        tool_calls: list[ToolCall] = []
        finish_reason = FinishReason.UNKNOWN

        for candidate_index, candidate in enumerate(
            getattr(response, "candidates", None) or []
        ):
            candidate_reason = self._candidate_finish_reason(candidate)
            if candidate_reason is not FinishReason.UNKNOWN:
                finish_reason = candidate_reason
            candidate_content = getattr(candidate, "content", None)
            for part_index, part in enumerate(
                getattr(candidate_content, "parts", None) or []
            ):
                text = getattr(part, "text", None)
                if text:
                    content.append(TextPart(text=text))
                function_call = getattr(part, "function_call", None)
                if function_call is not None:
                    arguments = getattr(function_call, "args", None) or {}
                    tool_calls.append(
                        ToolCall(
                            call_id=getattr(function_call, "id", None)
                            or f"gemini-call-{candidate_index}-{part_index}",
                            name=getattr(function_call, "name", None) or "",
                            arguments=json.dumps(
                                arguments, separators=(",", ":"), sort_keys=True
                            ),
                        )
                    )

        if tool_calls:
            finish_reason = FinishReason.TOOL_CALL
        elif finish_reason is FinishReason.UNKNOWN:
            finish_reason = FinishReason.COMPLETED

        parsed = (
            self._parsed_output(response, request.response_schema, content)
            if finish_reason is FinishReason.COMPLETED
            else None
        )
        return AIResponse(
            provider=self.name,
            model=getattr(response, "model_version", None)
            or resolve_model(self._models, request.profile),
            content=content,
            parsed=parsed,
            tool_calls=tool_calls,
            finish_reason=finish_reason,
            usage=self._usage(getattr(response, "usage_metadata", None)),
            provider_request_id=getattr(response, "response_id", None),
        )

    def _stream_response(
        self,
        *,
        request: AIRequest,
        model: str,
        response_id: str | None,
        fragments: list[str],
        calls: dict[str, dict[str, str]],
        finish_reason: FinishReason,
        usage: TokenUsage | None,
    ) -> AIResponse:
        content = [TextPart(text="".join(fragments))] if fragments else []
        parsed = (
            self._parsed_output(None, request.response_schema, content)
            if finish_reason is FinishReason.COMPLETED
            else None
        )
        return AIResponse(
            provider=self.name,
            model=model,
            content=content,
            parsed=parsed,
            tool_calls=[
                ToolCall(
                    call_id=call_id,
                    name=value["name"],
                    arguments=value["arguments"] or "{}",
                )
                for call_id, value in calls.items()
            ],
            finish_reason=finish_reason,
            usage=usage,
            provider_request_id=response_id,
        )

    @staticmethod
    def _parsed_output(
        response: Any,
        schema: type[BaseModel] | None,
        content: list[TextPart],
    ) -> BaseModel | None:
        if schema is None:
            return None
        parsed = getattr(response, "parsed", None)
        if isinstance(parsed, schema):
            return parsed
        try:
            if parsed is not None:
                return schema.model_validate(parsed)
            return schema.model_validate_json("".join(part.text for part in content))
        except (ValidationError, ValueError, TypeError) as exc:
            raise MalformedProviderResponseError(
                "Gemini returned an invalid structured response",
                provider=ProviderName.GEMINI,
                cause=exc,
            ) from exc

    @staticmethod
    def _candidate_finish_reason(candidate: Any) -> FinishReason:
        raw = getattr(candidate, "finish_reason", None)
        value = str(getattr(raw, "value", raw) or "").upper()
        if value in {"STOP", "FINISH_REASON_UNSPECIFIED"}:
            return FinishReason.COMPLETED
        if value in {"MAX_TOKENS", "MAX_OUTPUT_TOKENS"}:
            return FinishReason.MAX_TOKENS
        if value in {
            "SAFETY",
            "BLOCKLIST",
            "PROHIBITED_CONTENT",
            "SPII",
            "RECITATION",
            "IMAGE_SAFETY",
        }:
            return FinishReason.SAFETY_BLOCKED
        return FinishReason.UNKNOWN

    @staticmethod
    def _usage(usage: Any) -> TokenUsage | None:
        if usage is None:
            return None
        input_tokens = int(getattr(usage, "prompt_token_count", 0) or 0)
        output_tokens = int(getattr(usage, "candidates_token_count", 0) or 0)
        total_tokens = int(
            getattr(usage, "total_token_count", input_tokens + output_tokens)
            or input_tokens + output_tokens
        )
        details = {
            "cached_tokens": int(
                getattr(usage, "cached_content_token_count", 0) or 0
            ),
            "thought_tokens": int(getattr(usage, "thoughts_token_count", 0) or 0),
            "tool_tokens": int(
                getattr(usage, "tool_use_prompt_token_count", 0) or 0
            ),
        }
        return TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            details={key: value for key, value in details.items() if value},
        )

    def _normalize_error(self, exc: Exception) -> AIProviderError:
        if isinstance(exc, AIProviderError):
            return exc
        if isinstance(exc, TimeoutError):
            return ProviderTimeoutError(
                "Gemini request timed out",
                provider=self.name,
                retryable=True,
                cause=exc,
            )
        if isinstance(exc, genai_errors.APIError):
            code = int(getattr(exc, "code", 0) or 0)
            request_id = getattr(exc, "request_id", None)
            common = {
                "provider": self.name,
                "provider_request_id": request_id,
                "cause": exc,
            }
            if code in {401, 403}:
                return AuthenticationError("Gemini authentication failed", **common)
            if code == 429:
                return RateLimitError(
                    "Gemini rate limit exceeded", retryable=True, **common
                )
            if code in {408, 504}:
                return ProviderTimeoutError(
                    "Gemini request timed out", retryable=True, **common
                )
            if code >= 500:
                return ProviderUnavailableError(
                    "Gemini is unavailable", retryable=True, **common
                )
            return InvalidProviderRequestError("Gemini request failed", **common)
        return ProviderUnavailableError(
            "Gemini request failed",
            provider=self.name,
            retryable=True,
            cause=exc,
        )

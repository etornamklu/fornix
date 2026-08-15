"""Provider-neutral AI orchestration for the patient Medfind chat."""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterable, Mapping
from typing import Any

from src.ai import (
    AIMessage,
    AIProvider,
    AIRequest,
    Completed,
    Refused,
    Role,
    TextDelta,
    UsageReported,
)
from src.prompts.ai_patient import PATIENT_MEDFIND


def build_medfind_request(
    *,
    patient_data: Mapping[str, Any],
    history: Iterable[Mapping[str, Any]],
    user_message: str,
    temperature: float | None,
) -> AIRequest:
    """Translate persisted Medfind history into the canonical AI request."""

    messages = [
        AIMessage.text(
            Role.SYSTEM,
            PATIENT_MEDFIND.format(patient_data=dict(patient_data)),
        )
    ]
    supported_history_roles = {
        Role.USER.value: Role.USER,
        Role.ASSISTANT.value: Role.ASSISTANT,
    }
    for item in history:
        role = supported_history_roles.get(str(item.get("role", "")))
        content = item.get("content")
        if role is not None and isinstance(content, str) and content:
            messages.append(AIMessage.text(role, content))

    messages.append(AIMessage.text(Role.USER, user_message))
    return AIRequest(messages=messages, temperature=temperature)


async def stream_medfind_completion(
    provider: AIProvider,
    request: AIRequest,
) -> AsyncIterator[dict[str, Any]]:
    """Map normalized stream events to Medfind's existing SSE payload shape."""

    emitted_content = False
    async for event in provider.stream(request):
        if isinstance(event, TextDelta):
            emitted_content = True
            yield {"content": event.text, "token_stats": None}
        elif isinstance(event, Refused):
            emitted_content = True
            yield {"content": event.reason, "token_stats": None}
        elif isinstance(event, UsageReported):
            yield {
                "content": None,
                "token_stats": {
                    "output_tokens": event.usage.output_tokens,
                    "input_tokens": event.usage.input_tokens,
                },
            }
        elif isinstance(event, Completed) and not emitted_content:
            if event.response.text:
                emitted_content = True
                yield {"content": event.response.text, "token_stats": None}

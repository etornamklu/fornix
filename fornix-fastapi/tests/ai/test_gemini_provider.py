import asyncio
from types import SimpleNamespace
from typing import Any

from pydantic import BaseModel

from src.ai import (
    AIMessage,
    AIRequest,
    Completed,
    FinishReason,
    Role,
    StructuredDelta,
    TextDelta,
    ToolArgumentsDelta,
    ToolCallStarted,
    ToolChoice,
    ToolChoiceMode,
    ToolDefinition,
    UsageReported,
)
from src.ai.providers.gemini import GeminiProvider


class Answer(BaseModel):
    answer: str


class FakeGeminiModels:
    def __init__(self, response: Any, chunks: list[Any] | None = None) -> None:
        self.response = response
        self.chunks = chunks or []
        self.calls: list[tuple[str, dict[str, Any]]] = []

    async def generate_content(self, **kwargs: Any) -> Any:
        self.calls.append(("generate", kwargs))
        return self.response

    async def generate_content_stream(self, **kwargs: Any):
        self.calls.append(("stream", kwargs))

        async def iterate():
            for chunk in self.chunks:
                yield chunk

        return iterate()


def usage() -> Any:
    return SimpleNamespace(
        prompt_token_count=4,
        candidates_token_count=3,
        total_token_count=7,
        cached_content_token_count=0,
        thoughts_token_count=0,
        tool_use_prompt_token_count=0,
    )


def candidate(*parts: Any, finish_reason: str = "STOP") -> Any:
    return SimpleNamespace(
        finish_reason=finish_reason,
        finish_message=None,
        content=SimpleNamespace(parts=list(parts)),
    )


def gemini_response(**overrides: Any) -> Any:
    values = {
        "response_id": "gemini-response-1",
        "model_version": "gemini-test-model",
        "candidates": [candidate(SimpleNamespace(text="hello", function_call=None))],
        "usage_metadata": usage(),
        "parsed": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_generate_translates_tools_and_response() -> None:
    models = FakeGeminiModels(gemini_response())
    provider = GeminiProvider(
        api_key=None,
        models={"default": "gemini-test-model"},
        client=SimpleNamespace(models=models),
    )
    tool = ToolDefinition(
        name="weather",
        description="Look up weather",
        parameters={
            "type": "object",
            "properties": {"city": {"type": "string"}},
        },
    )
    request = AIRequest(
        messages=[
            AIMessage.text(Role.SYSTEM, "Be concise"),
            AIMessage.text(Role.USER, "Weather"),
        ],
        tools=[tool],
        tool_choice=ToolChoice(mode=ToolChoiceMode.SPECIFIC, name="weather"),
    )

    response = asyncio.run(provider.generate(request))

    call_type, arguments = models.calls[0]
    assert call_type == "generate"
    assert arguments["config"]["system_instruction"] == "Be concise"
    declaration = arguments["config"]["tools"][0]["function_declarations"][0]
    assert declaration["parameters_json_schema"] == tool.parameters
    function_config = arguments["config"]["tool_config"][
        "function_calling_config"
    ]
    assert function_config["mode"] == "ANY"
    assert function_config["allowed_function_names"] == ["weather"]
    assert response.text == "hello"
    assert response.finish_reason is FinishReason.COMPLETED
    assert response.usage is not None and response.usage.total_tokens == 7


def test_generate_normalizes_structured_output() -> None:
    parsed = Answer(answer="yes")
    response_value = gemini_response(
        candidates=[
            candidate(
                SimpleNamespace(text='{"answer":"yes"}', function_call=None)
            )
        ],
        parsed=parsed,
    )
    models = FakeGeminiModels(response_value)
    provider = GeminiProvider(
        api_key=None,
        models={"default": "gemini-test-model"},
        client=SimpleNamespace(models=models),
    )
    request = AIRequest(
        messages=[AIMessage.text(Role.USER, "Answer")],
        response_schema=Answer,
    )

    response = asyncio.run(provider.generate(request))

    assert models.calls[0][1]["config"]["response_schema"] is Answer
    assert response.parsed == parsed


def test_stream_normalizes_text_tool_and_usage_events() -> None:
    text_part = SimpleNamespace(text="Hello", function_call=None)
    call_part = SimpleNamespace(
        text=None,
        function_call=SimpleNamespace(
            id="call_1",
            name="weather",
            args={"city": "Accra"},
            partial_args=None,
        ),
    )
    chunks = [
        gemini_response(candidates=[candidate(text_part, finish_reason="")]),
        gemini_response(candidates=[candidate(call_part, finish_reason="STOP")]),
    ]
    models = FakeGeminiModels(gemini_response(), chunks)
    provider = GeminiProvider(
        api_key=None,
        models={"default": "gemini-test-model"},
        client=SimpleNamespace(models=models),
    )
    request = AIRequest(messages=[AIMessage.text(Role.USER, "Hello")])

    async def collect():
        return [event async for event in provider.stream(request)]

    normalized = asyncio.run(collect())

    assert isinstance(normalized[0], TextDelta)
    assert isinstance(normalized[1], ToolCallStarted)
    assert isinstance(normalized[2], ToolArgumentsDelta)
    assert isinstance(normalized[3], UsageReported)
    assert isinstance(normalized[4], Completed)
    assert normalized[4].response.finish_reason is FinishReason.TOOL_CALL
    assert normalized[4].response.tool_calls[0].arguments == '{"city":"Accra"}'


def test_structured_stream_emits_json_fragments() -> None:
    text = '{"answer":"yes"}'
    chunks = [
        gemini_response(
            candidates=[
                candidate(SimpleNamespace(text=text, function_call=None))
            ]
        )
    ]
    models = FakeGeminiModels(gemini_response(), chunks)
    provider = GeminiProvider(
        api_key=None,
        models={"default": "gemini-test-model"},
        client=SimpleNamespace(models=models),
    )
    request = AIRequest(
        messages=[AIMessage.text(Role.USER, "Answer")],
        response_schema=Answer,
    )

    async def collect():
        return [event async for event in provider.stream(request)]

    normalized = asyncio.run(collect())

    assert isinstance(normalized[0], StructuredDelta)
    assert isinstance(normalized[-1], Completed)
    assert normalized[-1].response.parsed == Answer(answer="yes")


def test_structured_safety_block_is_not_reported_as_malformed_json() -> None:
    blocked = gemini_response(
        candidates=[candidate(finish_reason="SAFETY")],
        parsed=None,
    )
    models = FakeGeminiModels(blocked)
    provider = GeminiProvider(
        api_key=None,
        models={"default": "gemini-test-model"},
        client=SimpleNamespace(models=models),
    )
    request = AIRequest(
        messages=[AIMessage.text(Role.USER, "Answer")],
        response_schema=Answer,
    )

    response = asyncio.run(provider.generate(request))

    assert response.finish_reason is FinishReason.SAFETY_BLOCKED
    assert response.parsed is None

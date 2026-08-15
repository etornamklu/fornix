import asyncio
from types import SimpleNamespace
from typing import Any

from pydantic import BaseModel
from pydantic import TypeAdapter
from openai.types.responses.response_input_param import ResponseInputParam

from src.ai import (
    AIMessage,
    AIRequest,
    Completed,
    FinishReason,
    ImagePart,
    Role,
    StructuredDelta,
    TextDelta,
    TextPart,
    ToolArgumentsDelta,
    ToolCallStarted,
    ToolChoice,
    ToolChoiceMode,
    ToolDefinition,
    UsageReported,
)
from src.ai.providers.openai import OpenAIProvider


class Answer(BaseModel):
    answer: str


class FakeOpenAIStream:
    def __init__(self, events: list[Any], final_response: Any) -> None:
        self.events = events
        self.final_response = final_response

    async def __aenter__(self) -> "FakeOpenAIStream":
        return self

    async def __aexit__(self, *args: Any) -> None:
        return None

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        for event in self.events:
            yield event

    async def get_final_response(self) -> Any:
        return self.final_response


class FakeResponses:
    def __init__(self, response: Any, events: list[Any] | None = None) -> None:
        self.response = response
        self.events = events or []
        self.calls: list[tuple[str, dict[str, Any]]] = []

    async def create(self, **kwargs: Any) -> Any:
        self.calls.append(("create", kwargs))
        return self.response

    async def parse(self, **kwargs: Any) -> Any:
        self.calls.append(("parse", kwargs))
        return self.response

    def stream(self, **kwargs: Any) -> FakeOpenAIStream:
        self.calls.append(("stream", kwargs))
        return FakeOpenAIStream(self.events, self.response)


def openai_response(**overrides: Any) -> Any:
    values = {
        "id": "resp_123",
        "model": "openai-test-model",
        "status": "completed",
        "output": [
            SimpleNamespace(
                type="message",
                content=[SimpleNamespace(type="output_text", text="hello")],
            )
        ],
        "output_text": "hello",
        "output_parsed": None,
        "usage": SimpleNamespace(
            input_tokens=3,
            output_tokens=2,
            total_tokens=5,
        ),
        "incomplete_details": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_generate_translates_multimodal_tools_and_response() -> None:
    responses = FakeResponses(openai_response())
    provider = OpenAIProvider(
        api_key=None,
        models={"default": "openai-test-model"},
        client=SimpleNamespace(responses=responses),
    )
    tool = ToolDefinition(
        name="weather",
        description="Look up weather",
        parameters={
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
            "additionalProperties": False,
        },
    )
    request = AIRequest(
        messages=[
            AIMessage.text(Role.SYSTEM, "Be concise"),
            AIMessage(
                role=Role.USER,
                content=[
                    TextPart(text="What is shown?"),
                    ImagePart(data=b"png", mime_type="image/png"),
                ],
            ),
        ],
        tools=[tool],
        tool_choice=ToolChoice(mode=ToolChoiceMode.REQUIRED),
    )

    response = asyncio.run(provider.generate(request))

    call_type, arguments = responses.calls[0]
    assert call_type == "create"
    TypeAdapter(ResponseInputParam).validate_python(arguments["input"])
    assert arguments["instructions"] == "Be concise"
    assert arguments["input"][0]["content"][1]["image_url"].startswith(
        "data:image/png;base64,"
    )
    assert arguments["tools"][0]["strict"] is True
    assert arguments["tool_choice"] == "required"
    assert arguments["store"] is False
    assert response.text == "hello"
    assert response.finish_reason is FinishReason.COMPLETED
    assert response.usage is not None and response.usage.total_tokens == 5


def test_prior_assistant_and_tool_messages_are_valid_responses_input() -> None:
    from src.ai import ToolCallPart, ToolResultPart

    request = AIRequest(
        messages=[
            AIMessage.text(Role.USER, "Use the tool"),
            AIMessage(
                role=Role.ASSISTANT,
                content=[
                    TextPart(text="I will look that up."),
                    ToolCallPart(
                        call_id="call_1",
                        name="weather",
                        arguments='{"city":"Accra"}',
                    ),
                ],
            ),
            AIMessage(
                role=Role.TOOL,
                content=[
                    ToolResultPart(
                        call_id="call_1",
                        name="weather",
                        output="Sunny",
                    )
                ],
            ),
        ]
    )

    translated = OpenAIProvider._input(request)

    TypeAdapter(ResponseInputParam).validate_python(translated)
    assert translated[1]["role"] == "assistant"
    assert translated[1]["content"][0]["type"] == "input_text"
    assert translated[2]["type"] == "function_call"


def test_generate_uses_native_structured_parse() -> None:
    parsed = Answer(answer="yes")
    responses = FakeResponses(
        openai_response(output_text='{"answer":"yes"}', output_parsed=parsed)
    )
    provider = OpenAIProvider(
        api_key=None,
        models={"default": "openai-test-model"},
        client=SimpleNamespace(responses=responses),
    )
    request = AIRequest(
        messages=[AIMessage.text(Role.USER, "Answer")],
        response_schema=Answer,
    )

    response = asyncio.run(provider.generate(request))

    call_type, arguments = responses.calls[0]
    assert call_type == "parse"
    assert arguments["text_format"] is Answer
    assert response.parsed == parsed


def test_stream_normalizes_text_tool_and_usage_events() -> None:
    function_item = SimpleNamespace(
        type="function_call",
        id="item_1",
        call_id="call_1",
        name="weather",
    )
    final = openai_response(
        output=[
            SimpleNamespace(
                type="function_call",
                id="item_1",
                call_id="call_1",
                name="weather",
                arguments='{"city":"Accra"}',
            )
        ]
    )
    events = [
        SimpleNamespace(type="response.output_text.delta", delta="Hello"),
        SimpleNamespace(type="response.output_item.added", item=function_item),
        SimpleNamespace(
            type="response.function_call_arguments.delta",
            item_id="item_1",
            delta='{"city":"Accra"}',
        ),
    ]
    responses = FakeResponses(final, events)
    provider = OpenAIProvider(
        api_key=None,
        models={"default": "openai-test-model"},
        client=SimpleNamespace(responses=responses),
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


def test_structured_stream_emits_json_fragments() -> None:
    final = openai_response(
        output_text='{"answer":"yes"}',
        output_parsed=Answer(answer="yes"),
    )
    responses = FakeResponses(
        final,
        [
            SimpleNamespace(
                type="response.output_text.delta", delta='{"answer":"yes"}'
            )
        ],
    )
    provider = OpenAIProvider(
        api_key=None,
        models={"default": "openai-test-model"},
        client=SimpleNamespace(responses=responses),
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


def test_structured_refusal_is_not_reported_as_malformed_json() -> None:
    final = openai_response(
        output=[
            SimpleNamespace(
                type="message",
                content=[SimpleNamespace(type="refusal", refusal="No")],
            )
        ],
        output_text="",
    )
    responses = FakeResponses(final)
    provider = OpenAIProvider(
        api_key=None,
        models={"default": "openai-test-model"},
        client=SimpleNamespace(responses=responses),
    )
    request = AIRequest(
        messages=[AIMessage.text(Role.USER, "Answer")],
        response_schema=Answer,
    )

    response = asyncio.run(provider.generate(request))

    assert response.finish_reason is FinishReason.REFUSED
    assert response.parsed is None

from pathlib import Path

import pytest
from pydantic import BaseModel, ValidationError

from src.ai import (
    AIMessage,
    AIRequest,
    ImagePart,
    Role,
    TextPart,
    ToolChoice,
    ToolChoiceMode,
    ToolDefinition,
)


class StructuredAnswer(BaseModel):
    answer: str


def test_request_supports_text_images_and_model_profiles() -> None:
    request = AIRequest(
        messages=[
            AIMessage.text(Role.SYSTEM, "Be concise."),
            AIMessage(
                role=Role.USER,
                content=[
                    TextPart(text="Describe this"),
                    ImagePart(data=b"image", mime_type="image/png"),
                ],
            ),
        ],
        response_schema=StructuredAnswer,
    )

    assert request.has_images is True
    assert request.response_schema is StructuredAnswer


def test_request_rejects_nonportable_structured_tool_combination() -> None:
    tool = ToolDefinition(
        name="weather",
        description="Get the weather",
        parameters={"type": "object", "properties": {}},
    )

    with pytest.raises(ValidationError, match="cannot be combined"):
        AIRequest(
            messages=[AIMessage.text(Role.USER, "Hello")],
            response_schema=StructuredAnswer,
            tools=[tool],
        )


def test_specific_tool_must_exist_in_request() -> None:
    tool = ToolDefinition(
        name="weather",
        description="Get the weather",
        parameters={"type": "object", "properties": {}},
    )

    with pytest.raises(ValidationError, match="not present"):
        AIRequest(
            messages=[AIMessage.text(Role.USER, "Hello")],
            tools=[tool],
            tool_choice=ToolChoice(mode=ToolChoiceMode.SPECIFIC, name="search"),
        )


def test_provider_sdk_imports_are_confined_to_adapter_modules() -> None:
    ai_root = Path(__file__).parents[2] / "src" / "ai"
    violations: list[str] = []
    for path in ai_root.rglob("*.py"):
        if path.parent.name == "providers":
            continue
        source = path.read_text()
        if "import openai" in source or "from google" in source:
            violations.append(str(path.relative_to(ai_root)))

    assert violations == []

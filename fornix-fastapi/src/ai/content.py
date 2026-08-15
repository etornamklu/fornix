"""Provider-neutral message content."""

from __future__ import annotations

import json
from typing import Annotated, Literal, TypeAlias

from pydantic import BaseModel, Field, field_validator


class TextPart(BaseModel):
    """A text segment in a message."""

    type: Literal["text"] = "text"
    text: str = Field(min_length=1)


class ImagePart(BaseModel):
    """An inline image supplied to a multimodal model."""

    type: Literal["image"] = "image"
    data: bytes = Field(min_length=1)
    mime_type: str = Field(pattern=r"^image/[a-zA-Z0-9.+-]+$")


class ToolCallPart(BaseModel):
    """A provider-neutral function call emitted by an assistant."""

    type: Literal["tool_call"] = "tool_call"
    call_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    arguments: str = "{}"

    @field_validator("arguments")
    @classmethod
    def arguments_must_be_a_json_object(cls, value: str) -> str:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            raise ValueError("tool arguments must be valid JSON") from exc
        if not isinstance(parsed, dict):
            raise ValueError("tool arguments must decode to a JSON object")
        return value

    @property
    def arguments_dict(self) -> dict:
        return json.loads(self.arguments)


class ToolResultPart(BaseModel):
    """The application-owned result of a tool call."""

    type: Literal["tool_result"] = "tool_result"
    call_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    output: str
    is_error: bool = False


ContentPart: TypeAlias = Annotated[
    TextPart | ImagePart | ToolCallPart | ToolResultPart,
    Field(discriminator="type"),
]

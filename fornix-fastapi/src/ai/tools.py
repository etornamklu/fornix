"""Provider-neutral function tool definitions."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field, model_validator


class ToolDefinition(BaseModel):
    """A JSON-Schema function declaration understood by both providers."""

    name: str = Field(min_length=1, pattern=r"^[a-zA-Z_][a-zA-Z0-9_-]*$")
    description: str = Field(min_length=1)
    parameters: dict[str, Any]

    @model_validator(mode="after")
    def parameters_must_describe_an_object(self) -> "ToolDefinition":
        if self.parameters.get("type") != "object":
            raise ValueError("tool parameters must be a JSON Schema object")
        return self


class ToolChoiceMode(StrEnum):
    AUTO = "auto"
    REQUIRED = "required"
    NONE = "none"
    SPECIFIC = "specific"


class ToolChoice(BaseModel):
    mode: ToolChoiceMode = ToolChoiceMode.AUTO
    name: str | None = None

    @model_validator(mode="after")
    def specific_choice_requires_a_name(self) -> "ToolChoice":
        if self.mode is ToolChoiceMode.SPECIFIC and not self.name:
            raise ValueError("a specific tool choice requires a tool name")
        if self.mode is not ToolChoiceMode.SPECIFIC and self.name is not None:
            raise ValueError("tool name is only valid for a specific tool choice")
        return self

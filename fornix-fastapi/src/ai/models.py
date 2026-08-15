"""Canonical requests and responses for AI providers."""

from __future__ import annotations

from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .content import ContentPart, ImagePart, TextPart, ToolCallPart, ToolResultPart
from .tools import ToolChoice, ToolChoiceMode, ToolDefinition


class ProviderName(StrEnum):
    OPENAI = "openai"
    GEMINI = "gemini"


class ModelProfile(StrEnum):
    DEFAULT = "default"
    FAST = "fast"
    STRUCTURED = "structured"
    VISION = "vision"


class Role(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class FinishReason(StrEnum):
    COMPLETED = "completed"
    MAX_TOKENS = "max_tokens"
    TOOL_CALL = "tool_call"
    REFUSED = "refused"
    SAFETY_BLOCKED = "safety_blocked"
    CANCELLED = "cancelled"
    UNKNOWN = "unknown"


class AIMessage(BaseModel):
    role: Role
    content: list[ContentPart] = Field(min_length=1)

    @model_validator(mode="after")
    def content_must_match_role(self) -> "AIMessage":
        if self.role is Role.SYSTEM and not all(
            isinstance(part, TextPart) for part in self.content
        ):
            raise ValueError("system messages may contain text only")
        if self.role is Role.TOOL and not all(
            isinstance(part, ToolResultPart) for part in self.content
        ):
            raise ValueError("tool messages may contain tool results only")
        if self.role is Role.USER and any(
            isinstance(part, (ToolCallPart, ToolResultPart)) for part in self.content
        ):
            raise ValueError("user messages cannot contain tool calls or tool results")
        if self.role is Role.ASSISTANT and any(
            isinstance(part, (ImagePart, ToolResultPart)) for part in self.content
        ):
            raise ValueError("assistant messages cannot contain images or tool results")
        return self

    @classmethod
    def text(cls, role: Role, text: str) -> "AIMessage":
        return cls(role=role, content=[TextPart(text=text)])


class AIRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    messages: list[AIMessage] = Field(min_length=1)
    profile: ModelProfile = ModelProfile.DEFAULT
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_output_tokens: int | None = Field(default=None, gt=0)
    response_schema: type[BaseModel] | None = None
    tools: list[ToolDefinition] = Field(default_factory=list)
    tool_choice: ToolChoice = Field(default_factory=ToolChoice)
    request_id: str = Field(default_factory=lambda: str(uuid4()))

    @model_validator(mode="after")
    def validate_portable_feature_combinations(self) -> "AIRequest":
        if self.response_schema is not None and self.tools:
            raise ValueError(
                "structured output and function tools cannot be combined in the "
                "portable provider contract"
            )
        if not self.tools and self.tool_choice.mode not in {
            ToolChoiceMode.AUTO,
            ToolChoiceMode.NONE,
        }:
            raise ValueError("tool choice requires at least one tool")
        if (
            self.tool_choice.mode is ToolChoiceMode.SPECIFIC
            and self.tool_choice.name not in {tool.name for tool in self.tools}
        ):
            raise ValueError("the selected tool is not present in the request")
        return self

    @property
    def has_images(self) -> bool:
        return any(
            isinstance(part, ImagePart)
            for message in self.messages
            for part in message.content
        )


class TokenUsage(BaseModel):
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    total_tokens: int = Field(ge=0)
    details: dict[str, int] = Field(default_factory=dict)


class ToolCall(BaseModel):
    call_id: str
    name: str
    arguments: str

    def as_content_part(self) -> ToolCallPart:
        return ToolCallPart(
            call_id=self.call_id,
            name=self.name,
            arguments=self.arguments,
        )


class AIResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    provider: ProviderName
    model: str
    content: list[ContentPart] = Field(default_factory=list)
    parsed: BaseModel | None = None
    tool_calls: list[ToolCall] = Field(default_factory=list)
    finish_reason: FinishReason = FinishReason.UNKNOWN
    usage: TokenUsage | None = None
    provider_request_id: str | None = None
    provider_metadata: dict[str, Any] = Field(default_factory=dict)

    @property
    def text(self) -> str:
        return "".join(
            part.text for part in self.content if isinstance(part, TextPart)
        )

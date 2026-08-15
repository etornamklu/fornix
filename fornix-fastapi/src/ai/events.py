"""Normalized streaming events emitted by every provider."""

from __future__ import annotations

from typing import Annotated, Literal, TypeAlias

from pydantic import BaseModel, Field

from .models import AIResponse, TokenUsage


class TextDelta(BaseModel):
    type: Literal["text_delta"] = "text_delta"
    text: str


class StructuredDelta(BaseModel):
    type: Literal["structured_delta"] = "structured_delta"
    json_fragment: str


class ToolCallStarted(BaseModel):
    type: Literal["tool_call_started"] = "tool_call_started"
    call_id: str
    name: str


class ToolArgumentsDelta(BaseModel):
    type: Literal["tool_arguments_delta"] = "tool_arguments_delta"
    call_id: str
    fragment: str


class UsageReported(BaseModel):
    type: Literal["usage_reported"] = "usage_reported"
    usage: TokenUsage


class Refused(BaseModel):
    type: Literal["refused"] = "refused"
    reason: str


class Completed(BaseModel):
    type: Literal["completed"] = "completed"
    response: AIResponse


AIStreamEvent: TypeAlias = Annotated[
    TextDelta
    | StructuredDelta
    | ToolCallStarted
    | ToolArgumentsDelta
    | UsageReported
    | Refused
    | Completed,
    Field(discriminator="type"),
]

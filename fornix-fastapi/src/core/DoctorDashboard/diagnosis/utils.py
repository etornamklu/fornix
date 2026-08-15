from typing_extensions import AsyncGenerator
from langchain_core.runnables.schema import StreamEvent
from typing import AsyncGenerator, TypedDict, Union, Literal, Any, Optional
from enum import Enum


class StreamName(str, Enum):
    """Valid stream names"""

    CHATANTHROPIC = "chatanthropic"
    CHATOPENAI = "chatopenai"


class ToolUseContent(TypedDict):
    """Structure for tool use content"""

    type: Literal["tool_use"]
    partial_json: str


class ChunkData(TypedDict):
    """Structure for chunk data"""

    chunk: Any  # Type depends on the specific implementation


class StreamEvent(TypedDict):
    """Structure for stream events"""

    tags: list[str]
    name: str
    data: ChunkData


async def stream_async_iterator(stream: StreamEvent) -> AsyncGenerator[str, None]:
    if "analysis" not in stream["tags"]:
        return

    stream_name = stream["name"].lower()

    try:
        if stream_name == StreamName.CHATANTHROPIC:
            content = stream["data"]["chunk"].content
            if isinstance(content, list) and content and "partial_json" in content[0]:
                yield content[0]["partial_json"]

        elif stream_name == StreamName.CHATOPENAI:
            tool_calls = stream["data"]["chunk"].additional_kwargs.get("tool_calls", [])
            if tool_calls:
                yield tool_calls[0]["function"]["arguments"]

        else:
            raise ValueError(f"Invalid stream name: {stream_name}")

    except (AttributeError, KeyError, IndexError) as e:
        raise ValueError(f"Malformed stream data for {stream_name}: {str(e)}") from e

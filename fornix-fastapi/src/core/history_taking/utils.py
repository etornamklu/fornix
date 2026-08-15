import asyncio
from typing import AsyncGenerator
from langchain_core.runnables.schema import StreamEvent


async def on_chain_stream(stream: StreamEvent) -> AsyncGenerator[str, None]:
    if stream["name"] == "conclude_conversation":
        content = stream["data"]["chunk"]["messages"][0].content  # type: ignore
        for token in content.split():
            if content.startswith(token):
                yield str(token)
            else:
                yield " " + str(token)
            await asyncio.sleep(0.01)


async def on_chat_model_stream(stream: StreamEvent) -> AsyncGenerator[str, None]:
    chunk = stream["data"]["chunk"]  # type: ignore
    if not chunk.additional_kwargs.get("tool_calls"):
        content = chunk.content
        if isinstance(content, list) and content:
            content = content[0].get("text")
        if content:
            yield str(content)

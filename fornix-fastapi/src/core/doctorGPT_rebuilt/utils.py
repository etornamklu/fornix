import asyncio
import aiofiles
import json
from typing import AsyncGenerator, Dict
from langchain_core.runnables.schema import StreamEvent
from loguru import logger


async def write_runnable_to_file(runnable, filename):
    image = runnable.get_graph().draw_mermaid_png()
    async with aiofiles.open(filename, "wb") as f:
        await f.write(image)


def dict_to_markdown(json_data):
    markdown_string = ""
    for key, value in json_data.items():
        formatted_key = " ".join(word.capitalize() for word in key.split("_"))
        if isinstance(value, str):
            markdown_string += f"**{formatted_key}**: {value}\n\n"
        else:
            markdown_string += f"**{formatted_key}**:\n\n{value}\n\n"

    return markdown_string.strip()


async def on_chat_model_stream(stream: StreamEvent, signal: asyncio.Event) -> AsyncGenerator:
    chunk = stream["data"]["chunk"]   # type: ignore
    stream_name = stream["name"].lower()
    if stream_name == "chatopenai":
        tool_calls = chunk.additional_kwargs.get("tool_calls")
        if tool_calls is not None:
            tool = tool_calls[0]["function"]
            if signal.is_set():
                if (content := tool["arguments"]):
                    yield str(content)
            else:
                if str(tool["name"]).strip() == "MedicalResponse":
                    signal.set()
        else:
            if content := chunk.content:
                yield str(content)

    elif stream_name == "chatanthropic":
        content = chunk.content
        if isinstance(content, list) and content:
            if isinstance(content, list) and content and "partial_json" in content[0] and signal.is_set():
                yield content[0]["partial_json"]
            else:
                if content[0].get("name") == "MedicalResponse":
                    signal.set()
        else:
            if content:
                yield str(content)




async def on_chain_stream(stream: StreamEvent) -> AsyncGenerator:
    if isinstance((chain_stream := stream["data"]["chunk"]), dict):  # type: ignore
        if fallback_response := chain_stream.get("fallback", ""):
            for token in str(fallback_response["agent_outcome"].content).split():
                if fallback_response["agent_outcome"].content.startswith(token):
                    yield token
                else:
                    yield " " + token
                await asyncio.sleep(0.01)

from typing import AsyncGenerator
import json
from langchain_core.runnables.schema import StreamEvent

from src.controller.stream_response import StreamEventHandler
from src.core.DoctorDashboard.diagnosis.utils import stream_async_iterator


async def on_chat_model_stream(stream: StreamEvent) -> AsyncGenerator[str, None]:
    if "analysis" in stream.get("tags", {}):
        async for token in stream_async_iterator(stream):  # type: ignore
            yield json.dumps({"stream": token})
        

async def on_chain_end(stream: StreamEvent) -> AsyncGenerator[str, None]:
    if "cleaner" in stream.get("tags", {}):
        output = stream.get("data", {}).get("output", "")
        yield json.dumps({"raw_transcript": {"transcript": output}})


class Streamer(StreamEventHandler):
    def __init__(self):
        super().__init__(on_chat_model_stream=on_chat_model_stream)

    async def default_on_chain_end(self, stream):
        _ = await anext(super().default_on_chain_end(stream))
        async for token in on_chain_end(stream):
            yield token
        

# kind = event["event"]
# if kind == "on_chat_model_stream" and "analysis" in event["tags"]:  # type: ignore
#     tool_calls = event["data"]["chunk"].additional_kwargs.get("tool_calls")  # type: ignore
#     if tool_calls:
#         token = tool_calls[0]["function"]["arguments"]
#         yield {"stream": token}
# elif kind == "on_chain_end" and "cleaner" in event["tags"]:  # type: ignore
#     output = event["data"]["output"]  # type: ignore
#     yield {"raw_transcript": {"transcript": output}}
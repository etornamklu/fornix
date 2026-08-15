from collections import defaultdict
import json
from typing import (
    Any,
    AsyncGenerator,
    Callable,
    Dict,
    AsyncIterator,
    Optional,
)
from langchain_core.runnables.schema import StreamEvent
from langchain_core.messages import AIMessage


class StreamEventHandler:

    def __init__(
            self,
            on_chat_model_stream: Callable[..., AsyncGenerator[Any, None]] | None = None,
            on_chain_end: Callable[..., AsyncGenerator[Any, None]] | None = None,
            on_chain_stream: Optional[Callable[..., AsyncGenerator[Any, None]]] = None,
    ):
        self.on_chat_model_stream = (
                on_chat_model_stream or self.default_on_chat_model_stream
        )
        self.on_chain_end = on_chain_end or self.default_on_chain_end
        self.on_chain_stream = on_chain_stream
        self._token_stats: Dict[str, set] = defaultdict(set)

    async def _update_token_stats(self, output: Any, input) -> None:
        if isinstance(output, AIMessage) and output.usage_metadata:
            for key in ("input_tokens", "output_tokens", "total_tokens"):
                self._token_stats[key].add(output.usage_metadata[key])  
        if isinstance(input, list):
            next_ai_message = next((i for i in input if isinstance(i, AIMessage)), None)
            if next_ai_message and next_ai_message.usage_metadata:
                for key in ("input_tokens", "output_tokens", "total_tokens"):
                    self._token_stats[key].add(next_ai_message.usage_metadata[key])  

    @property
    def token_stats(self) -> Dict[str, int]:
        return {k: sum(v) for k, v in self._token_stats.items()}

    async def default_on_chain_end(
            self, stream: StreamEvent
    ) -> AsyncGenerator[str, None]:
        out = stream["data"].get("output")
        input = stream["data"].get("input")
        await self._update_token_stats(out, input)
        yield ""
    
    async def default_on_chat_model_stream(
            self, stream: StreamEvent
    ) -> AsyncGenerator[Any, None]:
        if content := stream["data"]["chunk"].content:  # type: ignore
            if isinstance(content, list):
                if "text" in content[0]:
                    yield str(content[0]["text"])
                elif content[0].get("type") != "tool_use":
                    yield content
            else:
                yield content

    async def stream_llm_response(
            self,
            async_iterator: AsyncIterator[StreamEvent],
    ) -> AsyncGenerator[Any, None]:
        async for stream in async_iterator:
            event = stream["event"]
            if event == "on_chat_model_stream":
                async for token in self.on_chat_model_stream(stream):
                    if token:
                        yield token
            elif event == "on_chain_stream" and self.on_chain_stream:
                async for token in self.on_chain_stream(stream):
                    if token:
                        yield token
            elif event in ["on_chain_end", "on_chat_model_end"]:
                async for token in self.on_chain_end(stream):
                    if token:
                        yield token
        yield json.dumps({"token_stats": self.token_stats})

from typing import Any, AsyncGenerator, Dict, List, Optional, Literal

from openai import AsyncOpenAI
from pydantic import BaseModel, Field, model_validator#, SecretStr
from langchain_core.utils.env import get_from_dict_or_env


class OpenAIRealTimeTTS(BaseModel):
    """RealTimeTTS using OpenAI API"""

    model: Literal["tts-1-hd", "tts-1"] = "tts-1"
    voice: Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"] = "shimmer"
    format:Literal['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'] = 'mp3'
    speed: float = Field(1.0, ge=0.25, le=4.0)
    api_key: Optional[Any] = None
    client: Any = None

    @model_validator(mode="before")
    def check_client(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        api_key = values.get("api_key")
        if api_key is None:
            api_key = get_from_dict_or_env(values, "api_key", "OPENAI_API_KEY")
        if api_key is None:
            raise ValueError("api_key is required in the env or as a parameter")
        
        if "client" not in values:
            values["client"] = AsyncOpenAI(api_key=api_key)
        return values
    

    async def get_speech(self, text: str) -> AsyncGenerator[bytes, None]:
        async with self.client.audio.speech.with_streaming_response.create(
            input=text,
            model=self.model,
            voice=self.voice,
            response_format=self.format,
            speed=self.speed
        ) as response:
            chunk = await response.read()
            yield chunk

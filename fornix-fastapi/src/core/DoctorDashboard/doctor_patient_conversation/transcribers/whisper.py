import io
import os
from typing import List, Literal, Union
from openai import AsyncOpenAI, NOT_GIVEN

RESPONSE_FORMATS = Literal["json", "text", "srt", "verbose_json", "vtt"]


class OpenaiTranscriber:
    def __init__(
        self,
        model: Literal["whisper-1"] = "whisper-1",
        api_key: str | None = None,
        boost_words: List[str] = [],
        timestamp_granularities: List[Literal["word", "segment"]] = ["segment"],
        temperature: float = 0.0,
    ):
        if api_key is None:
            api_key = os.getenv("OPENAI_API_KEY")
        if api_key is None:
            raise ValueError(
                "API key is required as argument or in environment variable"
            )

        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        self.boost_words = boost_words
        self.timestamp_granularities = timestamp_granularities
        self.temperature = temperature

    async def translate(
        self,
        audio_file: Union[str, io.BytesIO],
        response_format: RESPONSE_FORMATS = "verbose_json",
    ):
        if isinstance(audio_file, str):
            with open(audio_file, "rb") as f:
                return await self._process_translation(f, response_format)

        elif isinstance(audio_file, io.BytesIO):
            return await self._process_translation(audio_file, response_format)
        else:
            raise ValueError(
                "audio_file must be either a file path (str) or a BytesIO instance"
            )

    async def transcribe(
        self,
        audio_file: Union[str, io.BytesIO],
        response_format: RESPONSE_FORMATS = "verbose_json",
    ):
        if isinstance(audio_file, str):
            with open(audio_file, "rb") as f:
                return await self._process_transcription(f, response_format)

        elif isinstance(audio_file, io.BytesIO):
            return await self._process_transcription(audio_file, response_format)
        else:
            raise ValueError(
                "audio_file must be either a file path (str) or a BytesIO instance"
            )

    async def _process_translation(
        self,
        file_buffer: io.BufferedReader | io.BytesIO,
        response_format: RESPONSE_FORMATS,
    ):
        async with self.client.audio.translations.with_streaming_response.create(
            model=self.model,
            file=file_buffer,
            response_format=response_format,
            prompt=", ".join(self.boost_words) if self.boost_words else NOT_GIVEN,
            temperature=self.temperature,
        ) as response:
            return await response.json()

    async def _process_transcription(
        self,
        file_buffer: io.BufferedReader | io.BytesIO,
        response_format: RESPONSE_FORMATS,
    ):
        async with self.client.audio.transcriptions.with_streaming_response.create(
            model=self.model,
            file=file_buffer,
            response_format=response_format,
            prompt=", ".join(self.boost_words) if self.boost_words else NOT_GIVEN,
            timestamp_granularities=self.timestamp_granularities,
            temperature=self.temperature,
        ) as response:
            return await response.json()

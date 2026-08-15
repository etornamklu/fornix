import assemblyai as aai
from assemblyai import RealtimeTranscriber
from typing import TYPE_CHECKING
import os
from assemblyai.types import AudioEncoding

if TYPE_CHECKING:
    from assemblyai.types import RealtimeTranscript, RealtimeError, RealtimeFinalTranscript, RealtimeSessionOpened


class TranscriptionService(RealtimeTranscriber):
    def __init__(self, api_key: str|None = None, sample_rate: int = 16000, encoding: str|None = None, utterance_silent_threshold: int = 1500):
        if not api_key and not (api_key := os.getenv("ASSEMBLYAI_API_KEY")):
            raise ValueError("API key is required")
        aai.settings.api_key = api_key
        super().__init__(
            on_data = self.on_data,
            on_error = self.on_error,
            on_close = self.on_close,
            on_open = self.on_open,
            sample_rate = sample_rate,
            # encoding = encoding,
            end_utterance_silence_threshold=utterance_silent_threshold
        )

    def on_open(self, session: "RealtimeSessionOpened"):
        pass

    def on_data(self, transcript: "RealtimeTranscript"):
        if not transcript.text:
            return
        if isinstance(transcript, RealtimeFinalTranscript):
            print(transcript.text, end="\r\n")
        else:
            print(transcript.text, end="\r")

    def on_close(self):
        pass

    def on_error(self, error: "RealtimeError"):
        pass

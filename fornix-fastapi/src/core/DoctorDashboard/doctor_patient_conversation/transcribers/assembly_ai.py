import asyncio
import os
import inspect
import json
from loguru import logger
from typing import Literal, Optional, Callable, Dict, Any
import websockets
from websockets.exceptions import WebSocketException


class AssemblyAIRealTimeTranscriber:
    def __init__(
        self,
        api_key: str | None = None,
        sample_rate: int = 16000,
        end_utterance_silence_threshold: int = 1000,
        encoding: Literal["pcm_mulaw", "pcm_s16le"] = "pcm_s16le",
        on_partial_transcript: Optional[Callable[[str], None]] = None,
        on_final_transcript: Optional[Callable[[str], None]] = None,
    ) -> None:
        api_key = api_key or os.getenv("ASSEMBLYAI_API_KEY")
        if not api_key:
            raise ValueError(
                (
                    "API key is required to use AssemblyAIRealTimeTranscriber."
                    "Provide it as an argument or set it as an environment variable."
                )
            )
        self.end_utterance_silence_threshold = end_utterance_silence_threshold
        self.api_key = api_key
        self.sample_rate = sample_rate
        self.aai_websocket_url = f"wss://api.assemblyai.com/v2/realtime/ws?sample_rate={sample_rate}&encoding={encoding}"
        self.headers = {"Authorization": api_key}
        self.aai_websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.on_partial_transcript = (
            on_partial_transcript or self._default_on_partial_transcript
        )
        self.on_final_transcript = (
            on_final_transcript or self._default_on_final_transcript
        )
        self._is_recording = False
        self.connection_established = asyncio.Event()

    async def on_message(self, message: str) -> None:
        try:
            transcript: Dict[str, Any] = json.loads(message)
            text: str = transcript.get("text", "")

            if transcript.get("message_type") == "PartialTranscript":
                res = self.on_partial_transcript(text)
                if inspect.isawaitable(res):
                    await res
            elif transcript.get("message_type") == "FinalTranscript":
                res = self.on_final_transcript(text)
                if inspect.isawaitable(res):
                    await res
            else:
                logger.info(f"Other message received: {message}")
        except json.JSONDecodeError:
            logger.error(f"Failed to decode message: {message}")
        except KeyError as e:
            logger.error(f"Missing key in transcript: {e}")

    async def send_configuration(self, websocket: websockets.WebSocketClientProtocol) -> None:
        config = {"end_utterance_silence_threshold": self.end_utterance_silence_threshold}
        await websocket.send(json.dumps(config))

    async def send_audio(self, audio_queue: asyncio.Queue) -> None:
        while self.is_recording:
            if not self.connection_established.is_set():
                logger.info("Waiting for WebSocket connection to be established...")
                await self.connection_established.wait()

            if self.aai_websocket and self.aai_websocket.open:
                try:
                    audio_data = await audio_queue.get()

                    if not isinstance(audio_data, bytes) or not audio_data:
                        logger.error("Invalid audio data format")
                        continue

                    await self.aai_websocket.send(audio_data)
                except websockets.exceptions.ConnectionClosed as e:
                    logger.info(f"WebSocket connection closed: {e}")
                    break  # Exit the loop when the connection is closed
                except Exception as e:
                    logger.error(f"Error sending audio data: {e}")
                    break
            else:
                logger.info("No active WebSocket connection. Exiting send_audio.")
                break

        logger.info("Recording stopped")

    async def receive_text(self) -> None:
        try:
            async with websockets.connect(
                self.aai_websocket_url, extra_headers=self.headers
            ) as websocket:
                self.aai_websocket = websocket
                logger.info("WebSocket connection established")
                self.connection_established.set()

                await self.send_configuration(websocket)

                while True:
                    try:
                        message = await websocket.recv()
                        await self.on_message(message)  # type: ignore[arg-type]
                    except websockets.ConnectionClosed as e:
                        logger.info(f"WebSocket closed: {e}")
                        break
                    except WebSocketException as e:
                        await self.on_error(websocket, e)
                        break
        except Exception as e:
            logger.error(f"Connection error: {e}")
            self.connection_established.clear()
        finally:
            logger.info("Exiting receive_text.")

    async def on_error(self, websocket, error: Exception) -> None:
        logger.error(f"WebSocket error: {error}")
        if isinstance(error, WebSocketException):
            logger.info("Attempting to reconnect...")
        else:
            logger.error("Unexpected error occurred", exc_info=True)

    @staticmethod
    async def _default_on_partial_transcript(text: str) -> None:
        print(f"Partial transcript received: {text}", end="\r")

    @staticmethod
    async def _default_on_final_transcript(text: str) -> None:
        print(f"Final transcript received: {text}", end="\r\n")

    async def stop_recording(self) -> None:
        logger.info("Stopping recording...")
        self._is_recording = False
        if self.aai_websocket and self.aai_websocket.open:
            await self.aai_websocket.close()
            self.aai_websocket = None
        self.connection_established.clear()

    def start_recording(self) -> None:
        self._is_recording = True

    @property
    def is_recording(self) -> bool:
        return self._is_recording

    async def start_transcribing(self, audio_queue: asyncio.Queue):
        receive_task = asyncio.create_task(self.receive_text())
        send_task = asyncio.create_task(self.send_audio(audio_queue))

        try:
            await asyncio.gather(receive_task, send_task)
        except websockets.ConnectionClosedOK:
            logger.info("WebSocket closed normally.")
        except websockets.ConnectionClosedError as e:
            logger.error(f"WebSocket connection closed with error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            receive_task.cancel()
            send_task.cancel()
            await asyncio.gather(receive_task, send_task, return_exceptions=True)
            logger.info("Transcription tasks have been canceled.")

    # async def push_audio_to_queue(self, audio_queue: asyncio.Queue, audio_data: bytes):
    #     await audio_queue.put(audio_data)

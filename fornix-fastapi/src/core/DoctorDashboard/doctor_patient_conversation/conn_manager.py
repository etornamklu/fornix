from fastapi.websockets import WebSocket
import asyncio
from loguru import logger
from typing import TYPE_CHECKING, Dict

if TYPE_CHECKING:
    from .transcribers.base import AudioTranscriber


class ConnectionManager:
    def __init__(self, websocket: WebSocket, transcriber: "AudioTranscriber") -> None:
        self.websocket = websocket
        self.audio_queue: asyncio.Queue = asyncio.Queue()
        self.transcriber = transcriber
        self.is_connected = False
        setattr(self.transcriber, "on_partial_transcript", self.on_partial_transcript)
        setattr(self.transcriber, "on_final_transcript", self.on_final_transcript)

    async def connect(self) -> None:
        await self.websocket.accept()
        self.is_connected = True

    async def push_audio_to_queue(self) -> None:
        self.transcriber.start_recording()
        try:
            while self.is_connected:
                audio_data = await self.websocket.receive_bytes()
                await self.audio_queue.put(audio_data)
        except asyncio.CancelledError:
            logger.info("Audio push task cancelled")
        finally:
            await self.transcriber.stop_recording()

    async def on_partial_transcript(self, text: str) -> None:
        await self.websocket.send_json({"type": "partial_transcript", "text": text})

    async def on_final_transcript(self, text: str) -> None:
        await self.websocket.send_json({"type": "final_transcript", "text": text})

    async def disconnect(self) -> None:
        self.is_connected = False
        try:
            await self.websocket.close()
        except RuntimeError as e:
            if "websocket.close" in str(e):
                logger.warning("WebSocket already closed")
            else:
                raise
        if self.transcriber.is_recording:
            await self.transcriber.stop_recording()
        logger.info("Disconnected")


class GlobalConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, ConnectionManager] = {}

    async def connect(
        self, thread_id: str, websocket: WebSocket, transcriber: "AudioTranscriber"
    ):
        connection_manager = ConnectionManager(websocket, transcriber)
        await connection_manager.connect()
        self.active_connections[thread_id] = connection_manager
        return connection_manager

    async def disconnect(self, thread_id: str):
        if thread_id in self.active_connections:
            await self.active_connections[thread_id].disconnect()
            del self.active_connections[thread_id]

    def get_connection(self, thread_id: str) -> ConnectionManager | None:
        return self.active_connections.get(thread_id)

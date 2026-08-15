import asyncio
from functools import partial
from uuid import uuid4
from typing import AsyncGenerator
import re

from loguru import logger
from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from src.core.history_taking.services.tts import OpenAIRealTimeTTS
from src.core.DoctorDashboard.doctor_patient_conversation.transcribers.base import (
    AudioTranscriber,
)
from src.libraries.config import get_settings
from src.core.history_taking.agent.main_graph import MainAgentGraph

settings = get_settings()


class RealTimeChat:
    def __init__(
        self,
        websocket: WebSocket,
        graph: MainAgentGraph,
        stt: AudioTranscriber,
        tts: OpenAIRealTimeTTS,
        thread_id: str,
        patient_id: str,
    ):
        self.websocket = websocket
        self.graph = graph
        self.stt = stt
        setattr(
            self.stt,
            "on_final_transcript",
            partial(
                self.on_final_transcript, thread_id=thread_id, patient_id=patient_id
            ),
        )
        setattr(self.stt, "on_partial_transcript", self.on_partial_transcript)
        self.tts = tts
        self.sentence_buffer = ""
        
        self.sentence_end_pattern = re.compile(r"(?<=[.!?])\s+")
        self.stt_queue: asyncio.Queue = asyncio.Queue()
        self.tts_queue: asyncio.Queue = asyncio.Queue()
        self.tasks: list[asyncio.Task] = []

    async def connect(self) -> None:
        await self.websocket.accept()

    async def disconnect(self) -> None:
        for task in self.tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        await self.websocket.close()

    async def push_audio_to_queue(self) -> None:
        self.stt.start_recording()
        try:
            while True:
                audio_data = await self.websocket.receive_bytes()
                await self.stt_queue.put(audio_data)
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except asyncio.CancelledError:
            logger.info("Audio push task cancelled")
        finally:
            await self.stt.stop_recording()

    async def on_final_transcript(self, text: str, thread_id: str, patient_id: str):
        try:
            full_response = []
            send_task = asyncio.create_task(
                self.websocket.send_json({"type": "final_transcript", "text": text})
            )
            async for token in self.call_llm(text, thread_id, patient_id):
                full_response.append(token)
            llm_text = "".join(full_response)

            llm_text_send_task = asyncio.create_task(
                self.websocket.send_json({"type": "llm_text", "text": llm_text})
            )
            tts_task = self.process_sentence(llm_text)
            await asyncio.gather(send_task, llm_text_send_task, tts_task)
        except Exception as e:
            logger.error(f"Error processing transcript: {e}")


    async def on_partial_transcript(self, text: str) -> None:
        await self.websocket.send_json({"type": "partial_transcript", "text": text})

    async def call_llm(
        self, text: str, thread_id: str, patient_id: str
    ) -> AsyncGenerator[str, None]:

        async with AsyncPostgresSaver.from_conn_string(
            settings.database_url
        ) as checkpointer:
            await checkpointer.setup()
            app = self.graph.compile_graph(checkpointer=checkpointer)
            try:
                async for stream in app.astream_events(
                    {"messages": [HumanMessage(content=text, id=str(uuid4()))]},
                    config={
                        "configurable": {
                            "thread_id": thread_id,
                            "patient_id": str(patient_id),
                        }
                    },
                    version="v2",
                ):
                    if (event := stream["event"]) == "on_chat_model_stream":
                        chunk = stream["data"]["chunk"]   #type: ignore
                        if not chunk.additional_kwargs.get("tool_calls"):
                            content = chunk.content
                            if content:
                                yield str(content)
            except Exception as e:
                logger.error(f"Error in LLM call: {e}")

    async def process_token(self, token: str) -> None:
        self.sentence_buffer += token
        sentences = self.sentence_end_pattern.split(self.sentence_buffer)

        for sentence in sentences[:-1]:
            await self.process_sentence(sentence.strip())

        self.sentence_buffer = sentences[-1]

    async def process_sentence(self, sentence: str) -> None:
        await self.tts_queue.put(sentence)
        logger.info(f"Pushed to TTS queue: {sentence}")

    async def text_to_speech_worker(self) -> None:
        try:
            while True:
                sentence = await self.tts_queue.get()
                try:
                    async for chunk in self.tts.get_speech(sentence):
                        await self.websocket.send_bytes(chunk)
                except Exception as e:
                    logger.error(f"Error in TTS processing: {e}")
                finally:
                    self.tts_queue.task_done()
        except asyncio.CancelledError:
            logger.info("TTS worker cancelled")

    async def run(self) -> None:
        self.tasks = [
            asyncio.create_task(self.text_to_speech_worker()),
            asyncio.create_task(self.push_audio_to_queue()),
            asyncio.create_task(self.stt.start_transcribing(self.stt_queue)),
        ]

        try:
            await asyncio.gather(*self.tasks)
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"Error in RealTimeChat: {e}")
        finally:
            await self.disconnect()


async def handle_websocket(
    graph,
    websocket: WebSocket,
    stt: AudioTranscriber,
    tts: OpenAIRealTimeTTS,
    thread_id: str,
    patient_id: str,
):
    chat = RealTimeChat(websocket, graph, stt, tts, thread_id, patient_id)
    await chat.connect()
    await chat.run()

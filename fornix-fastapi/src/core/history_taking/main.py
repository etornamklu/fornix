import asyncio
import json
from dotenv import load_dotenv

from src.core.DoctorDashboard.doctor_patient_conversation.transcribers.assembly_ai import (
    AssemblyAIRealTimeTranscriber,
)

load_dotenv(override=True)

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from src.libraries.config import get_settings
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from typing import AsyncGenerator
from loguru import logger
from uuid import UUID, uuid4
from .agent.main_graph import MainAgentGraph


import asyncio
from uuid import UUID

from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from loguru import logger

from src.core.history_taking.services.tts import OpenAIRealTimeTTS
from src.libraries.config import get_settings
from .realtime_chat.chat import handle_websocket


async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting lifespan")
    # await create_tables()
    yield
    logger.info("Ending lifespan")


app = FastAPI(lifespan=lifespan)  # type: ignore
app.mount(
    "/static", StaticFiles(directory="src/core/history_taking/static"), name="static"
)
templates = Jinja2Templates(directory="src/core/history_taking/static")


@app.get("/text-chat")
async def text_chat(request: Request):
    return templates.TemplateResponse("templates/text_chat.html", {"request": request})


@app.get("/voice-chat")
async def voice_chat(request: Request):
    return templates.TemplateResponse("voice/index.html", {"request": request})


# @app.post("/chat/{thread_id}")
# async def chat(message: Message, thread_id: str, patient_id: UUID):
#     async def stream_response():
#         async for stream in graph.astream_events(
#             {"messages": [HumanMessage(content=message.content, id=str(uuid4()))]},
#             config={"configurable": {"thread_id": thread_id, "patient_id": str(patient_id)}},
#             version="v2",
#         ):
#             if (event := stream["event"]) == "on_chat_model_stream":
#                 if not stream["data"]["chunk"].additional_kwargs.get("tool_calls"):
#                     content = stream["data"]["chunk"].content
#                     if isinstance(content, list) and content:
#                         content = content[0].get("text")
#                     if content:
#                         yield json.dumps({"stream": content}) + "\n"

#             elif event == "on_chain_end":
#                 if "patient_history" in stream["data"].get("input", {}):
#                     data = stream["data"]["input"]
#                     yield json.dumps(
#                         {
#                             "end": {
#                                 "patient_history": data["patient_history"],
#                                 "agent_on_duty": data.get("agent_on_duty"),
#                                 "agent_pass_validation": data.get("passed"),
#                                 "conclude": data.get("conclude"),
#                             }
#                         }
#                     ) + "\n"
#             elif event == "on_chain_stream":
#                 if stream["name"] == "conclude_conversation":
#                     content = stream["data"]["chunk"]["messages"][0].content  # type: ignore
#                     for token in content.split():
#                         if content.startswith(token):
#                             yield json.dumps({"stream": token}) + "\n"
#                         else:
#                             yield json.dumps({"stream": " " + token}) + "\n"
#                         await asyncio.sleep(0.01)

#                 # if isinstance((chain_stream := stream["data"]["chunk"]), dict):
#                 # if isinstance((chain_stream := stream["data"]["chunk"]), dict):  # type: ignore
#                 #     if fallback_response := chain_stream.get("conclude", ""):
#                 #         print(fallback_response)
#                         # for token in str(fallback_response["agent_outcome"].content).split():
#                         #     if fallback_response["agent_outcome"].content.startswith(token):
#                         #         yield token
#                         #     else:
#                         #         yield " " + token
#                         #     await asyncio.sleep(0.01)

#     return StreamingResponse(stream_response(), media_type="application/json")


settings = get_settings()


graph = MainAgentGraph(
    llm=init_chat_model(
        model=settings.llm,
        model_provider=settings.llm_provider,
        temperature=settings.llm_temperature,
        streaming=True,
        stream_usage=True,
    )
)


class Message(BaseModel):
    content: str


@app.post("/chat/{thread_id}")
async def chat(message: Message, thread_id: str, patient_id: UUID):
    async def stream_response():
        async with AsyncPostgresSaver.from_conn_string(
            settings.database_url
        ) as checkpointer:
            await checkpointer.setup()
            app = graph.compile_graph(checkpointer=checkpointer)
            async for stream in app.astream_events(
                {"messages": [HumanMessage(content=message.content, id=str(uuid4()))]},
                config={
                    "configurable": {
                        "thread_id": thread_id,
                        "patient_id": str(patient_id),
                    }
                },
                version="v2",
            ):
                if (event := stream["event"]) == "on_chat_model_stream":
                    chunk = stream["data"]["chunk"]  # type: ignore
                    if not chunk.additional_kwargs.get("tool_calls"):
                        content = chunk.content
                        if isinstance(content, list) and content:
                            content = content[0].get("text")
                        if content:
                            yield json.dumps({"stream": content}) + "\n"

                elif event == "on_chain_end":
                    if "patient_history" in stream["data"].get("input", {}):
                        data = stream["data"]["input"]  # type: ignore
                        yield json.dumps(
                            {
                                "end": {
                                    "patient_history": data["patient_history"],
                                    "agent_on_duty": data.get("agent_on_duty"),
                                    "agent_pass_validation": data.get("passed"),
                                    "conclude": data.get("conclude"),
                                }
                            }
                        ) + "\n"
                elif event == "on_chain_stream":
                    if stream["name"] == "conclude_conversation":
                        content = stream["data"]["chunk"]["messages"][0].content  # type: ignore
                        for token in content.split():
                            if content.startswith(token):
                                yield json.dumps({"stream": token}) + "\n"
                            else:
                                yield json.dumps({"stream": " " + token}) + "\n"
                            await asyncio.sleep(0.01)

    return StreamingResponse(stream_response(), media_type="application/json")


tts_service = OpenAIRealTimeTTS(speed=1.0, voice="alloy")
stt_service = AssemblyAIRealTimeTranscriber()


@app.websocket("/ws/chat/{thread_id}/{patient_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    thread_id: str,
    patient_id: UUID,
):
    try:
        await handle_websocket(
            graph, websocket, stt_service, tts_service, thread_id, patient_id
        )
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for thread {thread_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for thread {thread_id}: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000, log_level="info")

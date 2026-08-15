"""Route for patient history taking by AI agents."""

import base64
import json
import os
import uuid
import assemblyai as aai
from typing import Annotated, Any, Dict, List, AsyncGenerator, Sequence
from uuid import uuid4
import asyncio
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text, select
from sqlalchemy.orm import Session

from loguru import logger
from sse_starlette import EventSourceResponse

from src.database.schema.doctor import RenameChatHistory
from src.database.models.files import AudioUpload
from src.database.models.chat_message import ChatMessage
from src.database.models.chat_session import ChatSession
from src.database.database_connection import get_db
from src.database.schema.user import TokenData
from src.libraries.config import get_settings
from src.controller.auth import patient_decode_token, decode_token
from src.controller.patient_controller import get_patient_medfind_data
from src.ai import AIProviderRegistry, get_ai_provider_registry
from src.ai.settings import get_ai_settings

from src.core.history_taking.agent.main_graph import MainAgentGraph
from src.core.history_taking.utils import on_chat_model_stream, on_chain_stream
from src.core.history_taking.services.tts import OpenAIRealTimeTTS
from src.core.DoctorDashboard.doctor_patient_conversation.transcribers.assembly_ai import (
    AssemblyAIRealTimeTranscriber,
)
from src.core.history_taking.realtime_chat.chat import handle_websocket
from src.database.models.thread_ids import ThreadId
from src.controller.stream_response import StreamEventHandler
from . import UPSERT_THREAD

from src.controller.doc_patient import process_audio_chunks
from src.services.patient_medfind_ai import (
    build_medfind_request,
    stream_medfind_completion,
)


router = APIRouter()

settings = get_settings()
ai_settings = get_ai_settings()

graph = MainAgentGraph(
    llm=init_chat_model(
        model=settings.llm,
        model_provider=settings.llm_provider,
        temperature=settings.llm_temperature,
        streaming=True,
        stream_usage=True,
    )
)

tts_service = OpenAIRealTimeTTS(speed=1.0, voice="alloy")
stt_service = AssemblyAIRealTimeTranscriber()

aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")
transcriber = aai.Transcriber()


# stream_handler = StreamHandler


class Message(BaseModel):
    content: str
    content_type: str | None = None
    doctor_name: str = "JD"
    hospital_name: str = "Zomujo"
    branch_name: str = "Remote Care Clinic"


class ThreadIdResponse(BaseModel):
    thread_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="ignore")


async def get_checkpointer():
    async with AsyncPostgresSaver.from_conn_string(
            settings.database_url
    ) as checkpointer:
        await checkpointer.setup()
        yield checkpointer


@router.post("/chat/{thread_id}", response_class=EventSourceResponse)
async def chat(
        message: Message,
        thread_id: str,
        token_data: TokenData = Depends(patient_decode_token),
        checkpointer: AsyncPostgresSaver = Depends(get_checkpointer),
        db: Session = Depends(get_db),
) -> EventSourceResponse:
    streaming_handler = StreamEventHandler(
        on_chat_model_stream=on_chat_model_stream,
        on_chain_stream=on_chain_stream,
    )

    async def stream_response() -> AsyncGenerator[str, None]:
        upsert_task = None
        try:
            graph.doctor_name = message.doctor_name
            graph.hospital_name = message.hospital_name
            graph.branch_name = message.branch_name

            app = graph.compile_graph(checkpointer=checkpointer)

            db.execute(
                statement=text(UPSERT_THREAD),
                params={
                    "thread_id": thread_id,
                    "patient_id": token_data.user_id,
                    "type": "ai_doctor",
                },
            )
            upsert_task = asyncio.create_task(asyncio.to_thread(db.commit))

            messages = [HumanMessage(content=message.content, id=str(uuid4()), additional_kwargs={"input": "text"})]
            config = {
                "configurable": {
                    "thread_id": thread_id,
                    "patient_id": str(token_data.user_id),
                }
            }

            async_generator = app.astream_events(
                {"messages": messages},
                config=config,  # type: ignore
                version="v2",
            )
            async for token in streaming_handler.stream_llm_response(async_generator):
                yield token

        except asyncio.CancelledError:
            raise
        except Exception as e:
            # raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error in chat: {str(e)}",
            )
        finally:
            if upsert_task:
                await upsert_task

    return EventSourceResponse(stream_response(), ping=15)


@router.post("/chat/{thread_id}/voice", response_class=EventSourceResponse)
async def chat_with_voice(
        message: Message,
        thread_id: str,
        token_data: TokenData = Depends(patient_decode_token),
        checkpointer: AsyncPostgresSaver = Depends(get_checkpointer),
        db: Session = Depends(get_db),
) -> EventSourceResponse:
    streaming_handler = StreamEventHandler(
        on_chat_model_stream=on_chat_model_stream,
        on_chain_stream=on_chain_stream,
    )

    audio_data = base64.b64decode(message.content)

    upload = AudioUpload(
        id=str(uuid4()),
        user_id=token_data.user_id,
        filename=f"{token_data.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3",
        content_type=message.content_type if message.content_type else "audio/mpeg",
        content=audio_data,
    )
    db.add(upload)
    db.commit()

    data = await process_audio_chunks(audio_data)
    logger.info("audio transcribed successfully")

    async def stream_response() -> AsyncGenerator[str, None]:
        upsert_task = None
        try:

            graph.doctor_name = message.doctor_name
            graph.hospital_name = message.hospital_name
            graph.branch_name = message.branch_name

            app = graph.compile_graph(checkpointer=checkpointer)

            db.execute(
                statement=text(UPSERT_THREAD),
                params={
                    "thread_id": thread_id,
                    "patient_id": token_data.user_id,
                    "type": "ai_doctor",
                },
            )
            upsert_task = asyncio.create_task(asyncio.to_thread(db.commit))

            messages = [HumanMessage(content=data, id=str(uuid4()),
                                     additional_kwargs={"input": "audio", "audio_id": upload.id})]
            config = {
                "configurable": {
                    "thread_id": thread_id,
                    "patient_id": str(token_data.user_id),
                }
            }

            async_generator = app.astream_events(
                {"messages": messages},
                config=config,  # type: ignore
                version="v2",
            )
            async for token in streaming_handler.stream_llm_response(async_generator):
                yield token

        except asyncio.CancelledError:
            raise
        except Exception as e:
            # raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error in chat: {str(e)}",
            )
        finally:
            if upsert_task:
                await upsert_task

    return EventSourceResponse(stream_response(), ping=15)


@router.get(
    "/threads/{patient_id}",
    status_code=status.HTTP_200_OK,
    response_model=Sequence[ThreadIdResponse],
)
async def get_threads(
        patient_id: str,
        start: int | None = 0,
        end: int | None = None,
        token_data: TokenData = Depends(decode_token),
        db: Session = Depends(get_db),
):
    try:
        uuid.UUID(patient_id)
        stmt = (
            select(ThreadId)
            .where(ThreadId.patient_id == patient_id, ThreadId.type == "ai_doctor")
            .order_by(ThreadId.created_at.desc())
        )
        if start:
            stmt = stmt.offset(start)
        if end:
            stmt = stmt.limit(end)
        results = db.execute(stmt).scalars().all()
        return results
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid patient ID format",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving chat history: {str(e)}",
        )


@router.get(
    "/chat-history/{thread_id}",
    status_code=status.HTTP_200_OK,
    response_model=List[Dict[str, Any]],
)
async def get_chat_history(
        thread_id: str = Path(),
        token_data: TokenData = Depends(patient_decode_token),
        checkpointer: AsyncPostgresSaver = Depends(get_checkpointer),
):
    try:
        config = {
            "thread_id": str(thread_id),
            "patient_id": str(token_data.user_id),
        }

        results = await checkpointer.aget_tuple(
            config=RunnableConfig(configurable=config)
        )
        if results:
            return [
                m.dict()
                for m in results.checkpoint["channel_values"].get("messages", [])
            ]
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving chat history: {str(e)}",
        )


@router.websocket("/ws/chat/{thread_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        thread_id: str,
        token_data: Annotated[TokenData, Depends(patient_decode_token)],
):
    try:
        await handle_websocket(
            graph=graph,
            websocket=websocket,
            stt=stt_service,
            tts=tts_service,
            thread_id=thread_id,
            patient_id=str(token_data.user_id),
        )
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for thread {thread_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for thread {thread_id}: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)


# @router.websocket("/ws/chat/{thread_id}")
# async def websocket_endpoint(websocket: WebSocket, thread_id: str):
#     token = websocket.headers.get("Authorization", "").replace("Bearer ", "")
#     # print(token)
#     if not token:
#         await websocket.close(code=1008)
#         return

#     try:
#         token_data = token_decoder(token)
#     except Exception as e:
#         logger.error(str(e))
#         await websocket.close(code=1008)
#         return

#     try:
#         await handle_websocket(
#             graph=graph,
#             websocket=websocket,
#             stt=stt_service,
#             tts=tts_service,
#             thread_id=thread_id,
#             patient_id=str(token_data.user_id),
#         )
#     except WebSocketDisconnect:
#         logger.info(f"WebSocket disconnected for thread {thread_id}")
#     except Exception as e:
#         logger.error(f"Error in WebSocket connection for thread {thread_id}: {e}")
#         await websocket.close(code=status.WS_1011_INTERNAL_ERROR)


@router.post("/medfind/{thread_id}", response_class=EventSourceResponse)
async def patient_medfind(
        message: Message,
        thread_id: str,
        token_data: TokenData = Depends(patient_decode_token),
        db: Session = Depends(get_db),
        providers: AIProviderRegistry = Depends(get_ai_provider_registry),
):
    try:
        chat_session = (
            db.query(ChatSession).filter(ChatSession.session_id == thread_id).first()
        )
        if not chat_session:
            chat_session = ChatSession(
                id=uuid.uuid4(),
                session_id=thread_id,
                user_id=token_data.user_id,
                type="patient_gpt",
                name=f'{datetime.now().strftime("%Y-%m-%d_%H%M%S")}',
            )
            db.add(chat_session)
            db.commit()
            logger.info(
                f"Created new chat session {thread_id} for user {token_data.user_id}"
            )

        patient_data = get_patient_medfind_data(token_data.user_id, db)
        logger.debug(f"Patient data: {patient_data}")
        logger.info(f"Retrieved patient data for user {token_data.user_id}")

        history = (
            db.query(ChatMessage).filter(ChatMessage.session_id == thread_id).all()
        )
        if history:
            history = [json.loads(m.message) for m in history]
        else:
            history = []

        ai_request = build_medfind_request(
            patient_data=patient_data,
            history=history,
            user_message=message.content,
            temperature=settings.llm_temperature,
        )
        provider = providers.get(ai_settings.ai_medfind_provider)

        user_message = ChatMessage(
            id=uuid.uuid4(),
            session_id=chat_session.session_id,
            user_id=token_data.user_id,
            message=json.dumps({"role": "user", "content": message.content}),
            type="patient_gpt",
        )

        async def event_stream():
            ai_response_chunks = []

            async for chunk in stream_medfind_completion(provider, ai_request):
                yield f"data: {json.dumps(chunk)}\n\n"

                try:
                    if chunk and chunk != "[DONE]":
                        if chunk.get("content", ""):
                            ai_response_chunks.append(chunk.get("content", ""))
                except Exception as e:
                    logger.warning(f"Failed to parse AI chunk: {chunk} | Error: {e}")

            full_ai_response = "".join(ai_response_chunks)
            if full_ai_response:
                ai_message = ChatMessage(
                    id=uuid.uuid4(),
                    session_id=chat_session.session_id,
                    user_id=token_data.user_id,
                    message=json.dumps(
                        {"role": "assistant", "content": full_ai_response}
                    ),
                    type="patient_gpt",
                )
                db.add(user_message)
                db.add(ai_message)
                db.commit()

        return EventSourceResponse(event_stream(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in patient_medfind: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {str(e)}",
        )


@router.get("/medfind/threads")
async def patient_medfind_all_history(
        token_data: TokenData = Depends(patient_decode_token),
        db: Session = Depends(get_db),
):
    try:
        threads = (
            db.query(ChatSession)
            .join(ChatSession.messages)
            .filter(
                ChatMessage.user_id == token_data.user_id,
                ChatMessage.type == "patient_gpt",
            )
            .order_by(ChatSession.updated_at.desc())
            .all()
        )
        if not threads:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No chat history found for user",
            )

        return threads

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(f"Error in patient_medfind: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {str(e)}",
        )


@router.get("/medfind/chat-history/{thread_id}")
async def patient_medfind_history(
        thread_id: str,
        token_data: TokenData = Depends(patient_decode_token),
        db: Session = Depends(get_db),
):
    try:
        history = (
            db.query(ChatMessage).filter(ChatMessage.session_id == thread_id).all()
        )
        if not history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No chat history found for the given thread ID",
            )

        history = [json.loads(m.message) for m in history]
        return history

    except Exception as e:
        logger.error(f"Error in patient_medfind: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {str(e)}",
        )


@router.patch("/medfind/chat-history/{thread_id}")
async def rename_chat_session(
        request: RenameChatHistory,
        thread_id: str,
        token_data: Annotated[TokenData, Depends(patient_decode_token)],
        db: Session = Depends(get_db),
        type: str = "patient_gpt",
):
    """
    Endpoint for renaming a conversation in chat history.
    This updates the name attribute of the chat session.
    """
    try:
        chat_session = (
            db.query(ChatSession)
            .filter(
                ChatSession.session_id == thread_id,
                ChatSession.user_id == token_data.user_id,
                ChatSession.type == type,
            )
            .first()
        )

        if not chat_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or not authorized to update.",
            )

        chat_session.name = request.name
        db.commit()
        db.refresh(chat_session)

        return {
            "session_id": chat_session.session_id,
            "name": chat_session.name,
            "type": chat_session.type,
            "created_at": chat_session.created_at,
            "updated_at": chat_session.updated_at,
        }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e

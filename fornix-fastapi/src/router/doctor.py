"""Doctors controllers"""

import asyncio
import time
from datetime import datetime
import json
from functools import partial
from io import BytesIO
from typing import Annotated, Any, Dict, List, Literal
from loguru import logger
from uuid import uuid4, UUID

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, BackgroundTasks
from langchain.chat_models import init_chat_model

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputToolsParser
from langchain_core.runnables import RunnableConfig
from langchain_core.runnables import (
    RunnableWithMessageHistory,
    ConfigurableFieldSpec,
)
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

# from langchain_core.runnables.history import RunnableWithMessageHistory
from openai import OpenAIError
from sqlalchemy import desc
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import select
from sse_starlette import EventSourceResponse
from starlette import status

from src.controller.doc_patient import process_audio_chunks, process_audio_chunks_background
from src.database.models.files import AudioUpload
from src.database.models.doctor import DoctorReport
from src.controller.auth import doctor_decode_token, patient_decode_token
from src.controller.chat_history import ChatHistoryManager
from src.controller.doctor import online_doctors
from src.controller.patient_controller import fetch_patient
from src.controller.stream_response import StreamEventHandler

# from src.database.models.patient_dynamic_data import PatientDynamicData
from src.core.DoctorDashboard.diagnosis.utils import stream_async_iterator
from src.core.DoctorDashboard.lab_test_and_medications.prompts import (
    AI_PATIENT_CONVO_SUMMARY,
)
from src.core.DoctorDashboard.lab_test_and_medications.schema import (
    AIPatientConvoSummary,
)
from src.core.constants import MEDICAL_DOMAINS
from src.core.doctorGPT_rebuilt.utils import on_chat_model_stream, on_chain_stream
from src.core.doctorGPT_rebuilt.workflow.agent import AgentWorkflow
from src.core.doctorGPT_rebuilt.workflow.schemas import Message
from src.core.doctorGPT_rebuilt.workflow.tools import TavilySearchEngineTool

# from src.core.DoctorGPT.gpt import StreamingConversationChain
from src.database.database_connection import get_db
from src.database.models.chat_message import ChatMessage
from src.database.models.chat_session import ChatSession
from src.database.schema.doctor import (
    RenameChatHistory,
    ReportType,
    ProgressNote,
    ProcedureNote,
    AdmissionNote,
    DischargeSummary,
    OperativeNote,
    ReferralNote,
    DeathNote,
    PhysicalExaminationNote,
    TranscriptionAndMedicalNotes,
    ReportUpdate,
)
from src.database.schema.user import TokenData
from src.libraries.config import get_settings
from src.prompts.doctor import DOCTOR_REPORT
from src.services.redis import get_transcribed_text_from_cache, delete_cache, get_transcribed_audio_from_cache

# from starlette.responses import JSONResponse

router = APIRouter()
settings = get_settings()


search_engine = TavilySearchEngineTool(
    include_answer=False,  # include Tavily AI's answer in addition to the search results. IT INCREASES LATENCY!
    include_source=True,
    include_domains=MEDICAL_DOMAINS,  # TODO: add more domains or remove if not needed!
    max_results=3,  # Can be increased or decreased based on the requirements
    tavily_api_key=settings.tavily_api_key,
)

llm = init_chat_model(
    model=settings.llm,
    model_provider=settings.llm_provider,
    temperature=settings.llm_temperature,
    streaming=True,
    stream_usage=True,
)

graph = AgentWorkflow(llm=llm, tools=[search_engine])

agent = RunnableWithMessageHistory(
    runnable=graph.graph,
    input_messages_key="messages",
    history_messages_key="chat_history",
    output_messages_key="agent_outcome",
    get_session_history=lambda user_id, session_id, chat_type: ChatHistoryManager(
        session_id=session_id,
        user_id=user_id,
        chat_type=chat_type,
        db_session=next(get_db()),
    ),
    history_factory_config=[
        ConfigurableFieldSpec(
            id="user_id",
            annotation=str,
            name="User ID",
            description="Unique identifier for the user.",
            is_shared=True,
        ),
        ConfigurableFieldSpec(
            id="session_id",
            annotation=str,
            name="Session ID",
            description="Unique identifier for the conversation.",
            is_shared=True,
        ),
        ConfigurableFieldSpec(
            id="chat_type",
            annotation=str,
            name="Chat Type",
            description="Type of chat.",
            default="doc_gpt",
            is_shared=True,
        ),
    ],
).with_types(input_type=HumanMessage, output_type=AIMessage)


def get_report_schema(report_type: ReportType):
    match report_type:
        case ReportType.progress_note:
            return ProgressNote
        case ReportType.procedure_note:
            return ProcedureNote
        case ReportType.admission_note:
            return AdmissionNote
        case ReportType.discharge_summary:
            return DischargeSummary
        case ReportType.operative_note:
            return OperativeNote
        case ReportType.referral_note:
            return ReferralNote
        case ReportType.death_note:
            return DeathNote
        case ReportType.physical_examination:
            return PhysicalExaminationNote
        case ReportType.history_taking:
            return TranscriptionAndMedicalNotes
        case _:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report type: {report_type}",
            )


async def get_checkpointer():
    async with AsyncPostgresSaver.from_conn_string(
            settings.database_url
    ) as checkpointer:
        yield checkpointer


@router.get("/items/")
async def read_items(token: Annotated[TokenData, Depends(doctor_decode_token)]):
    """test endpoint"""
    return {"token": token}


@router.get("/static")
async def get_static_data_summary(
    patient_id: str,
    response: Response,
    _token: Annotated[TokenData, Depends(doctor_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for retrieving all patient static data"""
    try:
        result = fetch_patient(patient_id, db)
        if not result:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"message": "Patient Not Found"}
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


@router.post("/chat")
@router.post("/chat/{session_id}")
async def doctor_chat(
        message: Message,
        token_data: Annotated[TokenData, Depends(doctor_decode_token)],
        session_id: str = "blank",
):
    try:
        signal = asyncio.Event()
        stream_handler = StreamEventHandler(
            partial(on_chat_model_stream, signal=signal),
            on_chain_stream=on_chain_stream,
        )
        async_iterator = agent.astream_events(
            {"messages": [HumanMessage(**message.model_dump())]},
            version="v2",
            config={
                "configurable": {
                    "session_id": session_id,
                    "user_id": token_data.user_id,
                    "chat_type": "doc_gpt",
                }
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    else:
        return EventSourceResponse(
            stream_handler.stream_llm_response(async_iterator),
            # media_type="text/event-stream",
        )

@router.post("/chat/voice")
@router.post("/chat/voice/{session_id}")
async def doctor_chat_voice(
        file: UploadFile,
        token_data: Annotated[TokenData, Depends(doctor_decode_token)],
        db: Session = Depends(get_db),
        audio_id: str | None = None,
        session_id: str = "blank",
):
    try:
        logger.info(f"Received Audio with size: {file.size * 0.000001} mb, type: {file.content_type}")
        raw_audio_bytes = await file.read()
        audio_data = BytesIO(raw_audio_bytes)
        audio_data.name = file.filename

        if audio_id:
            logger.info(f"Using existing audio_id: {audio_id}")
            data = get_transcribed_text_from_cache(audio_id) + await process_audio_chunks(audio_data)
            full_audio_data = get_transcribed_audio_from_cache(audio_id) + raw_audio_bytes
            delete_cache(audio_id)
        else:
            logger.info("no audio_id provided, processing new audio")
            audio_id = str(uuid4())
            data = await process_audio_chunks(audio_data)
            full_audio_data = raw_audio_bytes

        upload = AudioUpload(
            id=audio_id,
            user_id=token_data.user_id,
            filename=f'{token_data.user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}_{file.filename}',
            content_type=file.content_type,
            content=full_audio_data,
        )
        db.add(upload)

        logger.info(f"audio data: {data}")
        signal = asyncio.Event()
        stream_handler = StreamEventHandler(
            partial(on_chat_model_stream, signal=signal),
            on_chain_stream=on_chain_stream,
        )
        async_iterator = agent.astream_events(
            {"messages": [HumanMessage(content=data, additional_kwargs={"input": "audio", "audio_id": audio_id})]},
            version="v2",
            config={
                "configurable": {
                    "session_id": session_id,
                    "user_id": token_data.user_id,
                    "chat_type": "doc_gpt",
                }
            },
        )

        await asyncio.to_thread(db.commit)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    else:
        return EventSourceResponse(
            stream_handler.stream_llm_response(async_iterator),
            # media_type="text/event-stream",
        )


@router.post(
    "/summary_aip/{thread_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(doctor_decode_token)
    ],  # TODO Confirm doctor has permission and add this to billable endpoint
)
async def summarize_ai_patient_thread(
        thread_id: str, checkpointer=Depends(get_checkpointer)
):
    try:
        stream_handler = StreamEventHandler(
            on_chat_model_stream=stream_async_iterator,
            # on_chain_stream=on_chain_stream,
        )
        config = {
            "thread_id": str(thread_id),
            # "patient_id": str(token_data.user_id),
        }

        results = await checkpointer.aget_tuple(
            config=RunnableConfig(configurable=config)
        )
        if results:
            mapping = {"human": "patient", "ai": "doctor"}
            threads = [
                f"{mapping[m.type]}: {m.content}"
                for m in results.checkpoint["channel_values"].get("messages", [])
            ]
            joined_threads = "\n".join(threads)
            async_iterator = (
                llm.bind_tools(
                    tools=[AIPatientConvoSummary],
                    tool_choice=AIPatientConvoSummary.__name__,
                )
                .with_config(config={"tags": ["analysis"]})
                .astream_events(
                    AI_PATIENT_CONVO_SUMMARY.format(conversation=joined_threads),
                    version="v2",
                )
            )
            return EventSourceResponse(
                stream_handler.stream_llm_response(async_iterator)
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No messages found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.get("/threads", response_model=List[Dict[str, Any]])
async def get_all_thread_ids(
        offset: int = 0,
        limit: int | None = None,
        *,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    """
    Endpoint for retrieving all chat sessions (threads) for the current user.
    Returns session name, session_id, created_at, and updated_at.
    """
    try:
        query = (
            select(
                ChatSession.name,
                ChatSession.session_id,
                ChatSession.created_at,
                ChatSession.updated_at,
            )
            .where(
                ChatSession.user_id == token_data.user_id,
                ChatSession.type == "doc_gpt",
                )
            .order_by(ChatSession.updated_at.desc())
        )

        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        result = db.execute(query).all()

        return [
            {
                "name": r.name,
                "session_id": r.session_id,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in result
        ]
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.get("/chat-history/{thread_id}")
async def get_conversation_history(
        thread_id: str,
        type: Literal["doc_gpt"] = "doc_gpt",
        *,
        token_data: Annotated[TokenData, Depends(doctor_decode_token)],
        db: Session = Depends(get_db),
):
    """Endpoint for retrieving chat history for a specific thread."""
    try:
        messages_query = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.session_id == thread_id,
                ChatMessage.user_id == token_data.user_id,
                ChatMessage.type == type,
                )
            .order_by(ChatMessage.updated_at.desc())
            .all()
        )
        messages = [json.loads(str(chat.message)) for chat in messages_query]
        return messages
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.patch("/chat-history/{thread_id}")
async def rename_conversation_history(
        request: RenameChatHistory,
        thread_id: str,
        token_data: Annotated[TokenData, Depends(doctor_decode_token)],
        db: Session = Depends(get_db),
        type: Literal["doc_gpt"] = "doc_gpt",
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

        # Update the name of the chat session
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
        db.rollback()  # Rollback in case of an error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.get("/online")
async def get_online_doctors(
        token: Annotated[TokenData, Depends(patient_decode_token)],
        skip: int = 0,
        limit: int = 5,
        db: Session = Depends(get_db),
):
    """endpoint for retrieving all online doctors"""
    count, doctors = online_doctors(db, token, skip, limit)
    return {"online_doctors": count, "doctors": doctors}


@router.post("/report")
async def stream_doctor_report(
    report_type: ReportType,
    file: UploadFile,
    background_tasks: BackgroundTasks,
    report_id: str | None = None,
    patient_id: str | None = None,
    last_chunk: bool = False,
    token_data: TokenData = Depends(doctor_decode_token),
    db: Session = Depends(get_db),
):

    if report_id is None:
        logger.info("no report_id provided")
        report_id = str(uuid4())

    try:
        logger.info(f"Received Audio with size: {file.size * 0.000001} mb, type: {file.content_type}")
        raw_audio_bytes = await file.read()
        audio_data = BytesIO(raw_audio_bytes)
        audio_data.name = file.filename

        if not last_chunk:
            logger.info("processing audio in the background")
            background_tasks.add_task(process_audio_chunks_background, report_id, audio_data, raw_audio_bytes)
            return {"report_id": report_id}

        filename=f"{token_data.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{report_type.value}.{file.filename.split('.')[-1]}"
        logger.info(f"audio name: {filename}")
        data = get_transcribed_text_from_cache(report_id) + await process_audio_chunks(audio_data)
        logger.info(f"audio data: {data}")

        report_schema = get_report_schema(report_type)

        start = time.time()
        messages = [
            SystemMessage(content=DOCTOR_REPORT),
            HumanMessage(
                content=f"Here is the doctor’s dictated narrative: \n\n{data}"
            ),
        ]

        chain = (
                llm.bind_tools(
                    tools=[report_schema], tool_choice=report_schema.__name__
                ).with_config(config={"tags": ["analysis"]})
                | JsonOutputToolsParser(first_tool_only=True)
                | (lambda x: report_schema(**x["args"]))
        )

        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)
        event_gen = chain.astream_events(
            messages, version="v2", include_tags=["analysis"]
        )

        chunks = []

        async def event_stream():
            try:
                yield json.dumps({"report_id": report_id})

                async for chunk in stream_handler.stream_llm_response(event_gen):
                    if "token_stat" not in chunk:
                        chunks.append(chunk)
                        if len(chunks) == 1:
                            logger.info(f"First chunk at: {time.time() - start}")
                    yield chunk

                processed_chunks = "".join(chunks)
                data_dict = json.loads(processed_chunks)
                report_content = report_schema.model_validate(data_dict)

                full_audio_data = get_transcribed_audio_from_cache(report_id) + raw_audio_bytes

                upload = AudioUpload(
                    id=uuid4(),
                    user_id=token_data.user_id,
                    filename=filename,
                    content_type=file.content_type,
                    content=full_audio_data,
                )
                db.add(upload)
                db.flush()

                logger.info("audio uploaded successfully")

                report = DoctorReport(
                    id=report_id,
                    doctor_id=token_data.user_id,
                    patient_id=patient_id,
                    name=f'REPORT_{datetime.now().strftime("%Y-%m-%d_%H:%M:%S")}',
                    type=report_type,
                    audio_id=upload.id,
                    content=report_content.model_dump(),
                )
                db.add(report)
                await asyncio.to_thread(db.commit)

                delete_cache(report_id)
            except Exception as e:
                logger.error(f"Exception while streaming: {e}")
                yield json.dumps({"error": str(e)})

        return EventSourceResponse(event_stream(), media_type="text/event-stream")
    except HTTPException as e:
        raise e
    except asyncio.CancelledError as e:
        logger.error(f"Report generation cancelled: {e}")
        raise HTTPException(
            status_code=499,
            detail="Report generation cancelled by client(fornix backend cancelled request)",
        )
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.get("/report")
async def get_doctor_reports(
        report_type: ReportType | None = None,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    try:
        query = db.query(DoctorReport).filter(
            DoctorReport.doctor_id == token_data.user_id
        )

        if not report_type:
            reports = query.order_by(desc(DoctorReport.updated_at)).all()

            return [
                {
                    "id": report.id,
                    "name": report.name,
                    "created_at": report.created_at,
                    "updated_at": report.updated_at,
                    "patient_id": report.patient_id,
                    "type": report.type,
                }
                for report in reports
            ]
        reports = (
            query.filter(DoctorReport.type == report_type)
            .order_by(desc(DoctorReport.updated_at))
            .all()
        )
        return [
            {
                "id": report.id,
                "name": report.name,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
                "patient_id": report.patient_id,
            }
            for report in reports
        ]
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{report_id}")
async def get_doctor_report(
        report_id: str,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(DoctorReport)
            .filter(
                DoctorReport.id == report_id,
                DoctorReport.doctor_id == token_data.user_id,
                )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        return report
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/report/{report_id}")
async def update_doctor_report(
        report_id: str,
        request: ReportUpdate,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(DoctorReport)
            .filter(
                DoctorReport.id == report_id,
                DoctorReport.doctor_id == token_data.user_id,
                )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")


        for key, value in request.model_dump().items():
            if value is not None:
                setattr(report, key, value)

        db.commit()
        db.refresh(report)
        return report
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/report/{report_id}/unlink-patient")
async def update_doctor_report_patient(
        report_id: str,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(DoctorReport)
            .filter(
                DoctorReport.id == report_id,
                DoctorReport.doctor_id == token_data.user_id,
                )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        report.patient_id = None
        db.commit()
        db.refresh(report)
        return report
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating report patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/report/{report_id}")
async def delete_doctor_report(
        report_id: str,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(DoctorReport)
            .filter(
                DoctorReport.id == report_id,
                DoctorReport.doctor_id == token_data.user_id,
                )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        db.delete(report)
        db.commit()
        return {"message": "Report deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
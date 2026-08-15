import asyncio
import base64
import os
from typing import List, Literal
import uuid

from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from langchain_openai.chat_models import ChatOpenAI
from loguru import logger
from sqlalchemy.orm import Session

from src.controller.auth import doctor_decode_token
from src.database.database_connection import get_db

# from src.database.models.recording import VoiceRecording
from src.database.schema.user import TokenData
from .conn_manager import GlobalConnectionManager
from .report.report_writer import PatientReportCreator
from .transcribers.assembly_ai import AssemblyAIRealTimeTranscriber
from .transcribers.whisper import OpenaiTranscriber
from .utils import flatten_dicts, split_audio_file


load_dotenv(override=True)
llm = ChatOpenAI(model="gpt-4o-2024-08-06", streaming=True)


def get_transcript(transcript: str, chunk_size: int, return_raw: bool):
    report_creator = PatientReportCreator(
        llm=llm, chunk_size=chunk_size, return_raw=return_raw
    )
    return StreamingResponse(
        content=report_creator(transcript),
        # media_type="application/x-ndjson",
    )


app = FastAPI()

app.mount(
    "/static",
    StaticFiles(
        directory="./src/core/DoctorDashboard/doctor_patient_conversation/static"
    ),
    name="static",
)

global_manager = GlobalConnectionManager()


@app.websocket("/realtime-transcription/ws/{thread_id}")
async def websocket_endpoint(websocket: WebSocket, thread_id: str):
    transcriber = AssemblyAIRealTimeTranscriber()
    connection_manager = await global_manager.connect(thread_id, websocket, transcriber)

    audio_push_task = asyncio.create_task(connection_manager.push_audio_to_queue())
    transcriber_task = asyncio.create_task(
        connection_manager.transcriber.start_transcribing(
            connection_manager.audio_queue
        )
    )

    try:
        await audio_push_task
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for thread {thread_id}")
    except Exception as e:
        logger.error(f"Error in thread {thread_id}: {e}")
    finally:
        await global_manager.disconnect(thread_id)
        audio_push_task.cancel()
        transcriber_task.cancel()
        await asyncio.gather(audio_push_task, transcriber_task, return_exceptions=True)


@app.post("/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    task: Literal["transcribe", "translate"] = Query("transcribe"),
    boost_words: List[str] = Query([]),
    response_format: Literal["json", "text", "srt", "verbose_json", "vtt"] = Query(
        "verbose_json"
    ),
    chunk_size: int = Query(4000),
    return_raw: bool = Query(False),
    token_data: TokenData = Depends(doctor_decode_token),
    db: Session = Depends(get_db),
):
    transcriber = OpenaiTranscriber(boost_words=boost_words)
    try:
        file_content = await audio_file.read()
        file_base64 = base64.b64encode(file_content).decode("utf-8")
        file_chunks = await asyncio.to_thread(
            split_audio_file,
            audio_source=file_content,
            chunk_length_minutes=10,
            filename=audio_file.filename or "speech.mp3",
            export_format="mp3",
        )
        if task == "transcribe":
            tasks = (
                transcriber.transcribe(file, response_format) for file in file_chunks
            )
        else:
            tasks = (
                transcriber.translate(file, response_format) for file in file_chunks
            )

        response = await asyncio.gather(*tasks)
        transcript_dict = flatten_dicts(response)
        recording = VoiceRecording(
            doctor_id=token_data.user_id,
            filename=audio_file.filename,
            audio=file_base64,
            duration=transcript_dict["duration"],
            raw_transcript=transcript_dict["text"],
            language=transcript_dict["language"],
            segments=transcript_dict["segments"],
        )
        db.add(recording)
        await asyncio.to_thread(db.commit)

        return get_transcript(transcript_dict["text"], chunk_size, return_raw)
    except Exception as e:
        # raise HTTPException(status_code=500, detail=str(e))
        raise e


@app.get("/")
async def _(request: Request):
    return Jinja2Templates(
        directory="./src/core/DoctorDashboard/doctor_patient_conversation/static"
    ).TemplateResponse("index.html", {"request": request})


# @app.post("/report")
# async def patient_report(
#     transcript: str = Form(...),
#     chunk_size: int = Form(4000),
#     return_raw: bool = Form(False),
# ):
#     try:
#         report_creator = PatientReportCreator(
#             llm=llm, chunk_size=chunk_size, return_raw=return_raw
#         )
#         return StreamingResponse(
#             content=report_creator(transcript),
#             media_type="application/x-ndjson",
#         )

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# schemas.py
from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Optional
from datetime import datetime


class UploadResponse(BaseModel):
    upload_id: uuid.UUID


class ProcessingRequest(BaseModel):
    upload_id: uuid.UUID
    task: Literal["transcribe", "translate"]
    boost_words: List[str] = []
    response_format: Literal["json", "text", "srt", "verbose_json", "vtt"] = (
        "verbose_json"
    )


class ProcessingResponse(BaseModel):
    job_id: uuid.UUID


class ReportRequest(BaseModel):
    job_id: str
    chunk_size: int = 4000
    return_raw: bool = False


class AudioUploadSchema(BaseModel):
    id: str
    used_id: str
    filename: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProcessingJobSchema(BaseModel):
    id: str
    upload_id: str
    task: str
    status: str
    error: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportSchema(BaseModel):
    id: str
    job_id: str
    chunk_size: int
    is_raw: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportResponse(BaseModel):
    id: str
    content: dict
    chunk_size: int
    is_raw: bool
    created_at: datetime


from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List, Literal
import asyncio
import base64
from pydantic import BaseModel
from uuid import uuid4

from src.database.models import AudioUpload, ProcessingJob


router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_audio(
    audio_file: UploadFile = File(...),
    token_data: TokenData = Depends(doctor_decode_token),
    db: Session = Depends(get_db),
):
    try:
        file_content = await audio_file.read()
        upload = AudioUpload(
            id=str(uuid4()),
            user_id=token_data.user_id,
            filename=audio_file.filename,
            content=file_content,
        )
        db.add(upload)
        await asyncio.to_thread(db.commit)

        return UploadResponse(upload_id=upload.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/transcribe",
    response_model=ProcessingResponse,
    dependencies=[Depends(doctor_decode_token)],
)
async def process_audio(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    upload = db.query(AudioUpload).filter(AudioUpload.id == request.upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    job = ProcessingJob(
        id=str(uuid4()), upload_id=upload.id, task=request.task, status="pending"
    )
    db.add(job)
    await asyncio.to_thread(db.commit)

    background_tasks.add_task(process_audio_task, str(job.id), request, db)

    return ProcessingResponse(job_id=job.id)


async def process_audio_task(job_id: str, request: ProcessingRequest, db: Session):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    job.status = "processing"
    db.commit()

    try:
        upload = (
            db.query(AudioUpload).filter(AudioUpload.id == request.upload_id).first()
        )
        transcriber = OpenaiTranscriber(boost_words=request.boost_words)

        file_chunks = await asyncio.to_thread(
            split_audio_file,
            audio_source=upload.content,
            chunk_length_minutes=10,
            filename=upload.filename or "speech.mp3",
            export_format="mp3",
        )

        process_func = (
            transcriber.transcribe
            if request.task == "transcribe"
            else transcriber.translate
        )
        tasks = [process_func(file, request.response_format) for file in file_chunks]

        response = await asyncio.gather(*tasks)
        transcript_dict = flatten_dicts(response)

        job.result = transcript_dict
        job.status = "completed"
        db.commit()
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        db.commit()


# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from typing import List, Optional
# from .schemas import ReportRequest, JobResponse, TranscriptResponse
# from .models import ProcessingJob
# from .dependencies import get_db, doctor_decode_token
# from .utils import get_transcript
# import asyncio

# router = APIRouter()

MAX_WAIT_TIME = 300  # Maximum wait time in seconds


@router.post("/report", dependencies=[Depends(doctor_decode_token)])
async def generate_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
):
    start_time = asyncio.get_event_loop().time()
    while True:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == request.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status == "completed":
            return get_transcript(
                job.result["text"], request.chunk_size, request.return_raw
            )
        elif job.status == "failed":
            raise HTTPException(status_code=400, detail=f"Job failed: {job.error}")
        elif job.status in ["pending", "processing"]:
            if asyncio.get_event_loop().time() - start_time > MAX_WAIT_TIME:
                raise HTTPException(status_code=408, detail="Job processing timeout")
            await asyncio.sleep(5)
        else:
            raise HTTPException(
                status_code=400, detail=f"Unknown job status: {job.status}"
            )


@router.get(
    "/jobs",
    response_model=List[JobResponse],
    dependencies=[Depends(doctor_decode_token)],
)
async def get_jobs(
    status: Optional[str] = Query(
        None, enum=["pending", "processing", "completed", "failed"]
    ),
    db: Session = Depends(get_db),
):
    query = db.query(ProcessingJob)
    if status:
        query = query.filter(ProcessingJob.status == status)
    return query.all()


@router.get(
    "/transcripts",
    response_model=List[TranscriptResponse],
    dependencies=[Depends(doctor_decode_token)],
)
async def get_transcripts(
    status: Optional[str] = Query(None, enum=["completed", "failed"]),
    db: Session = Depends(get_db),
):
    query = db.query(ProcessingJob).filter(
        ProcessingJob.status.in_(["completed", "failed"])
    )
    if status:
        query = query.filter(ProcessingJob.status == status)
    jobs = query.all()
    return [
        TranscriptResponse(
            job_id=job.id,
            status=job.status,
            text=job.result["text"] if job.status == "completed" else None,
            error=job.error if job.status == "failed" else None,
        )
        for job in jobs
    ]


@router.delete("/job/{job_id}", dependencies=[Depends(doctor_decode_token)])
async def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}


@router.delete("/transcript/{job_id}", dependencies=[Depends(doctor_decode_token)])
async def delete_transcript(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ["completed", "failed"]:
        raise HTTPException(
            status_code=400, detail="Cannot delete transcript for incomplete job"
        )
    job.result = None
    job.error = None
    db.commit()
    return {"message": "Transcript deleted successfully"}


app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)

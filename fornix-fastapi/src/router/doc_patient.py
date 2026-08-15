import asyncio
import json
from io import BytesIO
from typing import Dict
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import (
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    APIRouter,
    BackgroundTasks,
)
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from langchain.chat_models import init_chat_model
from loguru import logger
from sqlalchemy.orm import Session

from src.controller.auth import doctor_decode_token
from src.controller.doc_patient import process_audio_task, process_audio_chunks, process_audio_chunks_background
from src.core.DoctorDashboard.doctor_patient_conversation.conn_manager import (
    GlobalConnectionManager,
)
from src.core.DoctorDashboard.doctor_patient_conversation.report.report_writer import (
    PatientReportCreator,
)
from src.core.DoctorDashboard.doctor_patient_conversation.report.utils import Streamer
from src.core.DoctorDashboard.doctor_patient_conversation.transcribers.assembly_ai import (
    AssemblyAIRealTimeTranscriber,
)
from src.database.database_connection import get_db
from src.database.models.doctor import DoctorReport
from src.database.models.files import AudioUpload
from src.database.models.recording import ProcessingJob, Report
from src.database.schema.doc_patient import *  # noqa[401]
# from src.database.models.recording import VoiceRecording
from src.database.schema.user import TokenData
from src.database.schema.doctor import ReportType
from src.libraries.config import get_settings
from src.services.redis import get_transcribed_text_from_cache, delete_cache, get_transcribed_audio_from_cache

load_dotenv(override=True)

settings = get_settings()

llm = init_chat_model(
    model="gpt-4o-2024-08-06",  # TODO: Fix Anthropic issue and change to settings.llm
    model_provider="openai",
    temperature=settings.llm_temperature,
    streaming=True,
    stream_usage=True,
)

# def get_transcript(transcript: str, chunk_size: int, return_raw: bool):
#     report_creator = PatientReportCreator(
#         llm=llm, chunk_size=chunk_size, return_raw=return_raw
#     )
#     return report_creator(transcript)


router = APIRouter()
global_manager = GlobalConnectionManager()


@router.websocket(
    "/realtime-transcription/ws/{thread_id}",
    dependencies=[Depends(doctor_decode_token)],
)
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


# @router.post("/report")
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
#             media_type="routerlication/x-ndjson",
#         )

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# schemas.py


@router.post("/upload", response_model=UploadResponse)
async def upload_audio(
        audio_file: UploadFile = File(...),
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    logger.debug(f"Uploading file {audio_file.filename}")
    upload = (
        db.query(AudioUpload)
        .filter(
            AudioUpload.user_id == token_data.user_id,
            AudioUpload.filename == audio_file.filename,
        )
        .first()
    )
    if upload:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "File already exists",
                "upload_id": jsonable_encoder(upload.id),
            },
        )
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
)
async def transcribe_audio(
        request: ProcessingRequest,
        background_tasks: BackgroundTasks,
        token_data: TokenData = Depends(doctor_decode_token),
        db: Session = Depends(get_db),
):
    upload = (
        db.query(AudioUpload)
        .filter(
            AudioUpload.id == request.upload_id,
            AudioUpload.user_id == token_data.user_id,
        )
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    job = ProcessingJob(
        id=str(uuid4()), upload_id=upload.id, task=request.task, status="pending"
    )
    db.add(job)
    await asyncio.to_thread(db.commit)

    background_tasks.add_task(process_audio_task, str(job.id), request, db)

    return ProcessingResponse(job_id=job.id)


MAX_WAIT_TIME = 300


@router.post("/report")
async def generate_report(
        request: ReportRequest,
        db: Session = Depends(get_db),
        token_data: TokenData = Depends(doctor_decode_token),
):
    name = None
    address = None
    if corrections := request.corrections:
        name = corrections.name
        address = corrections.address
    start_time = asyncio.get_event_loop().time()
    while True:
        try:
            job = (
                db.query(ProcessingJob)
                .filter(ProcessingJob.id == request.job_id)
                .first()
            )
            if not job:
                raise HTTPException(status_code=404, detail="Job not found")

            if job.status == "completed":
                patient_data = ""
                clean_transcript: str | None = None

                logger.info(job.result["text"])

                async def stream_tokens():
                    nonlocal patient_data
                    nonlocal clean_transcript

                    async_iterator = PatientReportCreator(
                        llm=llm,
                        chunk_size=request.chunk_size,
                        return_raw=request.return_raw,
                    )(job.result["text"])
                    async for token_json in Streamer().stream_llm_response(
                            async_iterator
                    ):
                        logger.info("bread")
                        logger.info(token_json)
                        logger.info(json.loads(token_json))
                        if "raw_transcript" in (token := json.loads(token_json)):
                            clean_transcript = token["raw_transcript"]["transcript"]
                            logger.info(clean_transcript)
                        elif "stream" in token:
                            patient_data += token["stream"]
                            logger.info(patient_data)
                        yield token_json

                    json_data: Dict = json.loads(patient_data)
                    personal_info = json_data.get("personal_details", {})
                    if name:
                        personal_info["name"] = name
                    if address:
                        personal_info["address"] = address
                    json_data["personal_info"] = personal_info

                    history_taking_report = (
                        db.query(DoctorReport).filter(DoctorReport.id == job.id).first()
                    )

                    report_content = TranscriptionAndMedicalNotes(transcript=clean_transcript, medical_notes=json_data)

                    if not history_taking_report:
                        history_taking_report = DoctorReport(
                            id=job.id,
                            doctor_id=token_data.user_id,
                            patient_id=request.patient_id,
                            audio_id=job.upload_id,
                            type=ReportType.history_taking,
                            name=f'REPORT_{datetime.now().strftime("%Y-%m-%d_%H:%M:%S")}',
                            content=report_content.model_dump()
                        )
                    else:
                        history_taking_report.content = report_content.model_dump()
                    db.add(history_taking_report)
                    if clean_transcript is not None:
                        job.clean_transcript = clean_transcript
                    await asyncio.to_thread(db.commit)

                return StreamingResponse(stream_tokens(), media_type="application/json")
            elif job.status == "failed":
                raise HTTPException(status_code=400, detail=f"Job failed: {job.error}")
            elif job.status in ["pending", "processing"]:
                if asyncio.get_event_loop().time() - start_time > MAX_WAIT_TIME:
                    raise HTTPException(
                        status_code=408, detail="Job processing timeout"
                    )
                await asyncio.sleep(5)
            else:
                raise HTTPException(
                    status_code=400, detail=f"Unknown job status: {job.status}"
                )
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))



@router.post("/report/new")
async def generate_report_new(
        file: UploadFile,
        background_tasks: BackgroundTasks,
        report_id: str | None = None,
        patient_id: str | None = None,
        name: str | None = None,
        address: str | None = None,
        last_chunk: bool = False,
        db: Session = Depends(get_db),
        token_data: TokenData = Depends(doctor_decode_token),
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

        filename=f"{token_data.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_HISTORY_TAKING.{file.filename.split('.')[-1]}"
        logger.info(f"audio name: {filename}")
        data = get_transcribed_text_from_cache(report_id) + await process_audio_chunks(audio_data)
        logger.info(f"audio data: {data}")

        async def stream_tokens():
            try:
                patient_data = ""
                clean_transcript = None

                async_iterator = PatientReportCreator(llm=llm, return_raw=True)(data)

                yield json.dumps({"report_id": report_id}) + "\n"

                async for token_json in Streamer().stream_llm_response(async_iterator):
                    if "raw_transcript" in (token := json.loads(token_json)):
                        clean_transcript = token["raw_transcript"]["transcript"]
                    elif "stream" in token:
                        patient_data += token["stream"]
                    yield token_json

                json_data: Dict = json.loads(patient_data) if patient_data else {}
                personal_info = json_data.get("personal_details", {})
                if name:
                    personal_info["name"] = name
                if address:
                    personal_info["address"] = address
                json_data["personal_info"] = personal_info

                report_content = TranscriptionAndMedicalNotes(transcript=clean_transcript, medical_notes=json_data)

                full_audio_data = get_transcribed_audio_from_cache(report_id) + raw_audio_bytes

                upload = AudioUpload(
                    id=uuid4(),
                    user_id=token_data.user_id,
                    filename=filename,
                    content=full_audio_data,
                )
                db.add(upload)
                db.flush()

                logger.info("audio uploaded successfully")

                history_taking_report = DoctorReport(
                    id=report_id,
                    doctor_id=token_data.user_id,
                    patient_id=patient_id,
                    audio_id=upload.id,
                    type=ReportType.history_taking,
                    name=f'REPORT_{datetime.now().strftime("%Y-%m-%d_%H:%M:%S")}',
                    content=report_content.model_dump()
                )

                db.add(history_taking_report)
                await asyncio.to_thread(db.commit)

            except Exception as e:
                print("Error:",str(e))

        return StreamingResponse(stream_tokens(), media_type="application/json")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


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
    "/job/{job_id}",
    response_model=JobResponse,
    dependencies=[Depends(doctor_decode_token)],
)
async def get_job(job_id: str, db: Session = Depends(get_db)):
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    job.result = {}
    job.error = ""
    db.commit()
    return {"message": "Transcript deleted successfully"}


@router.get("/history/transcripts", response_model=List[ProcessingJobSchema])
async def get_doctor_transcripts(
        db: Session = Depends(get_db),
        token_data: TokenData = Depends(doctor_decode_token),
):
    try:
        query = (
            db.query(ProcessingJob)
            .join(AudioUpload)
            .filter(
                ProcessingJob.status == "completed",
                AudioUpload.user_id == token_data.user_id,
            )
        )
        results = query.all()
        # if not results:
        #     raise HTTPException(
        #         status_code=404, detail="No transcripts found for this doctor"
        #     )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/history/transcripts/{job_id}", response_model=TranscriptionAndMedicalNotes
)
async def get_doctor_transcription_and_notes(
        job_id: str,
        db: Session = Depends(get_db),
        token_data: TokenData = Depends(doctor_decode_token),
):
    query = (
        db.query(ProcessingJob)
        .join(AudioUpload)
        .join(Report)
        .filter(
            ProcessingJob.id == job_id,
            AudioUpload.user_id == token_data.user_id,
            ProcessingJob.status == "completed",
        )
        .first()
    )

    if not query:
        raise HTTPException(
            status_code=404, detail="No transcripts and notes found for this doctor"
        )

    return TranscriptionAndMedicalNotes(
        transcript=query.clean_transcript, medical_notes=query.reports.content, name = query.name
    )


@router.patch("/history/transcripts/{job_id}", response_model=ProcessingJobSchema)
async def rename_doctor_transcripts(
        request: UpdateJobNameRequest,
        job_id: str,
        db: Session = Depends(get_db),
        token_data: TokenData = Depends(doctor_decode_token),
):
    job = (
        db.query(ProcessingJob)
        .join(AudioUpload)
        .filter(
            ProcessingJob.id == job_id,
            AudioUpload.user_id == token_data.user_id,
        )
        .first()
    )
    if not job:
        raise HTTPException(
            status_code=404, detail="No transcripts found for this doctor"
        )
    job.name = request.name
    db.commit()
    db.refresh(job)
    return job


@router.post("/test/report", dependencies=[Depends(doctor_decode_token)])
async def test_generate_report(
        request: ReportRequest,
        db: Session = Depends(get_db),
):
    name = None
    address = None
    if corrections := request.corrections:
        name = corrections.name
        address = corrections.address
    start_time = asyncio.get_event_loop().time()
    while True:
        try:
            job = (
                db.query(ProcessingJob)
                .filter(ProcessingJob.id == request.job_id)
                .first()
            )
            if not job:
                raise HTTPException(status_code=404, detail="Job not found")

            if job.status == "completed":
                patient_data = ""
                clean_transcript = ""

                async_iterator = PatientReportCreator(
                    llm=llm,
                    chunk_size=request.chunk_size,
                    return_raw=request.return_raw,
                )(job.result["text"])
                async for token_json in Streamer().stream_llm_response(async_iterator):
                    if "raw_transcript" in (token := json.loads(token_json)):
                        clean_transcript = token["raw_transcript"]["transcript"]
                    elif "stream" in token:
                        patient_data += token["stream"]

                json_data: Dict = json.loads(patient_data)
                personal_info = json_data.get("personal_details", {})
                if name:
                    personal_info["name"] = name
                if address:
                    personal_info["address"] = address
                json_data["personal_info"] = personal_info

                patient_summary = (
                    db.query(Report).filter(Report.job_id == job.id).first()
                )
                if not patient_summary:
                    patient_summary = Report(job_id=job.id, content=json_data)
                else:
                    patient_summary.content = json_data
                db.add(patient_summary)
                if clean_transcript is not None:
                    job.clean_transcript = clean_transcript
                await asyncio.to_thread(db.commit)

                return TranscriptionAndMedicalNotes(
                    transcript=clean_transcript, medical_notes=json_data
                )
            elif job.status == "failed":
                raise HTTPException(status_code=400, detail=f"Job failed: {job.error}")
            elif job.status in ["pending", "processing"]:
                if asyncio.get_event_loop().time() - start_time > MAX_WAIT_TIME:
                    raise HTTPException(
                        status_code=408, detail="Job processing timeout"
                    )
                await asyncio.sleep(5)
            else:
                raise HTTPException(
                    status_code=400, detail=f"Unknown job status: {job.status}"
                )
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

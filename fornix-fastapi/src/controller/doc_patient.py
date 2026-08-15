import asyncio
import base64
import time
from io import BytesIO

from loguru import logger
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.database.schema.doc_patient import ProcessingRequest
from src.database.models.recording import ProcessingJob
from src.database.models.files import AudioUpload
from src.core.DoctorDashboard.doctor_patient_conversation.transcribers.whisper import (
    OpenaiTranscriber,
)
from src.core.DoctorDashboard.doctor_patient_conversation.utils import (
    split_audio_file,
    flatten_dicts,
    flatten_dict,
    fast_split_audio
)
from src.utils.execption_handling import openai_exception_handler
from src.services.redis import cache_transcribed_details_at_index, set_occupation_marker


async def process_audio_task(job_id: str, request: ProcessingRequest, db: Session):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    logger.info(f"Processing job {job_id}")
    if not job:
        logger.error(f"Job {job_id} not found")
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "processing"
    db.commit()

    try:
        upload = (
            db.query(AudioUpload).filter(AudioUpload.id == request.upload_id).first()
        )
        if not upload:
            logger.error(f"Upload {request.upload_id} not found")
            raise HTTPException(status_code=404, detail="Upload not found")
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
        logger.info(f"Transcription complete for job {job_id}")
        transcript_dict = flatten_dicts(response)
        logger.info(f"Transcript: {transcript_dict}")

        job.result = transcript_dict
        job.status = "completed"
        db.commit()
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        job.status = "failed"
        job.error = str(e)
        db.commit()


@openai_exception_handler
async def process_audio_by_id(audio_id: str, db: Session):

    upload = db.query(AudioUpload).filter(AudioUpload.id == audio_id).first()
    if not upload:
        logger.error(f"Upload {audio_id} not found")
        raise HTTPException(status_code=404, detail="Upload not found")

    # Run fast split in background thread
    start = time.time()
    extension = upload.filename.split(".")[-1]
    logger.info(f"Processing audio: {audio_id}, filetype: {extension}")
    chunks = await asyncio.to_thread(fast_split_audio, upload.content, f".{extension}", 45)
    logger.info(f"Audio split successfully in {time.time() - start} seconds")

    transcriber = OpenaiTranscriber()

    # Concurrent transcription
    start = time.time()
    tasks = [asyncio.create_task(transcriber.transcribe(chunk)) for chunk in chunks]
    responses = await asyncio.gather(*tasks)
    logger.info(f"Audio transcribed successfully in {time.time() - start} seconds")

    transcript_dict = flatten_dicts(responses)
    text = transcript_dict.get("text")
    if not text:
        raise HTTPException(status_code=204, detail="No text transcribed")

    return text

@openai_exception_handler
async def process_audio_chunks(chunk: BytesIO):

    transcriber = OpenaiTranscriber()

    start = time.time()
    responses = await transcriber.transcribe(chunk)
    logger.info(f"Audio transcribed successfully in {time.time() - start} seconds")

    transcript_dict = flatten_dict(responses)
    text = transcript_dict.get("text")

    if not text:
        raise HTTPException(status_code=204, detail="No text transcribed")

    return text


async def process_audio_chunks_background(report_id: str, audio_data: BytesIO, raw_audio_bytes: bytes):
    try:
        index = set_occupation_marker(report_id)
        logger.info("processing audio chunks in background")
        text = await process_audio_chunks(audio_data)
        details = {"audio_bytes": base64.b64encode(raw_audio_bytes).decode("utf-8"), "text": text}
        cache_transcribed_details_at_index(report_id=report_id, index=index, details=details)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error occurred while processing audio in background {str(e)}")
        raise e

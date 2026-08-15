import os
import tempfile
from datetime import datetime
from io import BytesIO
from typing import Dict
from uuid import uuid4

from fastapi import (
    Depends,
    HTTPException,
    UploadFile,
    APIRouter,
    BackgroundTasks,
    status,
    responses
)
from loguru import logger
from sqlalchemy.orm import Session

from src.controller.auth import decode_token
from src.controller.doc_patient import process_audio_chunks_background
from src.database.database_connection import get_db
from src.database.models import AudioUpload, ImageUpload
from src.database.schema.user import TokenData

router = APIRouter()

async def cleanup_temp_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary file: {e}")


@router.post("/audio/cache", response_model=Dict)
async def process_audio_chunks(
        file: UploadFile,
        background_tasks: BackgroundTasks,
        audio_id: str | None = None,
        _token_data: TokenData = Depends(decode_token),
):
    if audio_id is None:
        logger.info("no audio_id provided")
        audio_id = str(uuid4())

    try:
        logger.info(f"Received Audio with size: {file.size * 0.000001} mb, type: {file.content_type}")
        raw_audio_bytes = await file.read()
        audio_data = BytesIO(raw_audio_bytes)
        audio_data.name = file.filename

        logger.info("processing audio in the background")
        background_tasks.add_task(process_audio_chunks_background, audio_id, audio_data, raw_audio_bytes)
        return {"audio_id": audio_id}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audio/download/{audio_id}")
async def get_audio(
        audio_id: str,
        background_tasks: BackgroundTasks,
        _token_data: TokenData = Depends(decode_token),
        db: Session = Depends(get_db),
):
    try:
        audio = (
            db.query(AudioUpload).filter(AudioUpload.id == audio_id).first()
        )
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No audio found for the given audio ID",
            )

        suffix = audio.filename.split(".")[-1]

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_file_path = temp_file.name
        temp_file.write(audio.content)
        temp_file.close()

        logger.info(f"Created temporary file: {temp_file_path}")

        background_tasks.add_task(cleanup_temp_file, temp_file_path)

        return responses.FileResponse(
            path=temp_file_path,
            media_type=audio.content_type,
            filename=str(audio.filename),
        )

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(f"Error downloading audio: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {str(e)}",
        )

@router.post("/image", response_model=Dict)
async def upload_image(
        file: UploadFile,
        org_id: str | None = None,
        token_data: TokenData = Depends(decode_token),
        db: Session = Depends(get_db),
):

    try:
        logger.info(f"Received image with size: {file.size * 0.000001} mb, type: {file.content_type}")
        image_id = uuid4()

        upload = ImageUpload(
            id=image_id,
            user_id=token_data.user_id,
            org_id=org_id,
            filename=f"{token_data.user_id}_IMG_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}",
            content_type=file.content_type,
            content=await file.read(),
        )
        db.add(upload)
        db.commit()

        return {"image_id": image_id}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/download/{image_id}")
async def get_image(
        image_id: str,
        background_tasks: BackgroundTasks,
        _token_data: TokenData = Depends(decode_token),
        db: Session = Depends(get_db),
):
    try:
        image = (
            db.query(ImageUpload).filter(ImageUpload.id == image_id ).first()
        )
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No image found for {image_id}",
            )

        suffix = image.filename.split(".")[-1]

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_file_path = temp_file.name
        temp_file.write(image.content)
        temp_file.close()

        logger.info(f"Created temporary file: {temp_file_path}")
        background_tasks.add_task(cleanup_temp_file, temp_file_path)

        return responses.FileResponse(
            path=temp_file_path,
            media_type=image.content_type,
            filename=str(image.filename),
        )

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(f"Error downloading image: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the request: {str(e)}",
        )


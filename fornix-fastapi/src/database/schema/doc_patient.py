from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Optional
import uuid


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


class CorrectionRequest(BaseModel):
    name: str | None = None
    address: str | None = None


class ReportRequest(BaseModel):
    job_id: str
    patient_id: str | None = None
    chunk_size: int = 4000
    return_raw: bool = False
    corrections: Optional[CorrectionRequest] = None


class AudioUploadSchema(BaseModel):
    id: str
    user_id: str
    filename: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProcessingJobSchema(BaseModel):
    id: uuid.UUID
    name: str
    upload_id: uuid.UUID
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
    id: uuid.UUID
    content: dict
    chunk_size: int
    is_raw: bool
    created_at: datetime


class JobResponse(BaseModel):
    id: uuid.UUID
    upload_id: uuid.UUID
    task: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TranscriptResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    text: Optional[str]
    error: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class TranscriptionAndMedicalNotes(BaseModel):
    transcript: Optional[str]
    medical_notes: Optional[dict]

    model_config = ConfigDict(from_attributes=True)

class UpdateJobNameRequest(BaseModel):
    name: str
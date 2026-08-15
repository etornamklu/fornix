from datetime import datetime
from typing import Dict, Literal, Union, List, TYPE_CHECKING
import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    Integer,
    Text,
    String,
    ForeignKey,
    UUID,
    UniqueConstraint,
    LargeBinary,
    JSON,
    Enum,
)
from sqlalchemy.dialects.postgresql import JSONB

from . import TimeStampMixin

if TYPE_CHECKING:
    from .user import User


# class VoiceRecording(TimeStampMixin):
#     __tablename__ = "voice_recording"

#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
#     )
#     doctor_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), ForeignKey("users.id")
#     )
#     filename: Mapped[str] = mapped_column(String)
#     audio: Mapped[str] = mapped_column(Text)

#     user: Mapped["User"] = relationship("User", back_populates="voice_recordings")

#     __table_args__ = (UniqueConstraint("doctor_id", "filename"),)


# class AudioTranscription(TimeStampMixin):
#     __tablename__ = "audio_transcription"

#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
#     )
#     audio_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), ForeignKey("voice_recording.id")
#     )

#     duration: Mapped[int] = mapped_column(Integer)
#     raw_transcript: Mapped[str] = mapped_column(Text)
#     clean_transcript: Mapped[str] = mapped_column(Text, nullable=True)
#     language: Mapped[str] = mapped_column(String)
#     segments: Mapped[List[Dict[str, Union[float, str]]]] = mapped_column(JSONB)

#     audio: Mapped[VoiceRecording] = relationship(
#         "VoiceRecording", back_populates="transcription"
#     )





class ProcessingJob(TimeStampMixin):
    __tablename__ = "processing_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False, default=lambda: f"{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    upload_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audio_uploads.id"), nullable=False
    )
    task: Mapped[Literal["transcribe", "translate"]] = mapped_column(
        Enum("transcribe", "translate", name="task"), nullable=False
    )
    status: Mapped[Literal["pending", "processing", "completed", "failed"]] = (
        mapped_column(
            Enum("pending", "processing", "completed", "failed", name="status"), nullable=False
        )
    )
    result: Mapped[Dict] = mapped_column(JSON, nullable=True)
    clean_transcript: Mapped[str] = mapped_column(String, nullable=True)
    error: Mapped[str] = mapped_column(String, nullable=True)

    audio_upload: Mapped["AudioUpload"] = relationship(
        "AudioUpload", back_populates="processing_jobs"
    )
    reports: Mapped["Report"] = relationship("Report", back_populates="processing_job")


class Report(TimeStampMixin):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("processing_jobs.id"), nullable=False
    )
    content: Mapped[Dict] = mapped_column(JSON, nullable=False)
    # chunk_size = mapped_column(Integer, nullable=False)
    # is_raw = mapped_column(Boolean, nullable=False)

    processing_job: Mapped["ProcessingJob"] = relationship(
        "ProcessingJob", back_populates="reports"
    )

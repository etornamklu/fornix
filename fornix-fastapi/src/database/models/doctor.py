import enum
import uuid
from typing import Dict

from sqlalchemy import Enum, String, ForeignKey, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.database.models import TimeStampMixin


class ReportType(enum.Enum):
    progress_note = "progress_note"
    operative_note = "operative_note"
    admission_note = "admission_note"
    discharge_summary = "discharge_summary"
    procedure_note = "procedure_note"
    referral_note = "referral_note"
    death_note = "death_note"
    physical_examination = "physical_examination"
    history_taking = "history_taking"


class DoctorReport(TimeStampMixin):
    __tablename__ = "doctor_reports"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    audio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("audio_uploads.id"), nullable=True)
    type: Mapped[ReportType] = mapped_column(Enum(ReportType), index=True , nullable=False)
    content: Mapped[Dict] = mapped_column(JSONB)

    # doctor = relationship("User", back_populates="doctor_reports")
    # audio = relationship("AudioUpload", back_populates="doctor_reports")


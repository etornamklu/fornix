import enum
from typing import Dict
import uuid

from sqlalchemy import Enum, String, ForeignKey, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from src.database.models import TimeStampMixin


class RadiologistReportType(enum.Enum):
    xray = "xray"
    ct_scan = "ct_scan"
    ecg = "ecg"
    ultrasound = "ultrasound"

class LabReportType(enum.Enum):
    blood_test = "blood_test"
    urine_test = "urine_test"
    stool_test = "stool_test"
    biopsy = "biopsy"
    culture_and_sensitivity = "culture_and_sensitivity"

class RadiologistReport(TimeStampMixin):
    __tablename__ = "radiologist_reports"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    radiologist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[RadiologistReportType] = mapped_column(Enum(RadiologistReportType), index=True , nullable=False)
    clinical_context: Mapped[str] = mapped_column(String)
    content: Mapped[Dict] = mapped_column(JSONB)

    # doctor = relationship("User", back_populates="doctor_reports")
    # images = relationship("ImageUpload", back_populates="doctor_reports", cascade="all, delete-orphan")

class LabReports(TimeStampMixin):
    __tablename__ = "lab_reports"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    technician_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[LabReportType] = mapped_column(Enum(LabReportType), index=True , nullable=False)
    clinical_context: Mapped[str] = mapped_column(String)
    content: Mapped[Dict] = mapped_column(JSONB)

    # doctor = relationship("User", back_populates="doctor_reports")
    # images = relationship("ImageUpload", back_populates="doctor_reports", cascade="all, delete-orphan")


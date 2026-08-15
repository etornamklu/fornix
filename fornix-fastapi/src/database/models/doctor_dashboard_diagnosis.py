import uuid

from sqlalchemy import Column, String, ForeignKey, UUID, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from src.database.models import TimeStampMixin


class DoctorDashboardDiagnosis(TimeStampMixin):
    """Doctor dashboard diagnosis model"""

    __tablename__ = "doctor_dashboard_diagnoses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    summary = Column(String)
    differential_diagnosis = Column(JSONB)
    alternative_diagnoses = Column(JSONB)
    primary_index = Column(Integer, default=-1)  # -1 for most likely diagnosis
    clinical_items = Column(JSONB)
    name = Column(String)

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    doctor = relationship(
        "User",
        foreign_keys=[doctor_id],
        back_populates="diagnoses_created",
        lazy="select",
    )  # Optional doctor relationship

    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    patient = relationship(
        "User",
        foreign_keys=[patient_id],
        back_populates="diagnoses_received",
        lazy="select",
    )  # Optional patient relationship

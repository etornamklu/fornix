from __future__ import annotations

from typing import List, Literal, get_args
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, UUID, Enum, DateTime, ForeignKey
import uuid
from datetime import datetime
from .base import Base, TimestampMixin



MaritalStatus = Literal["Single", "Married", "Divorced", "Separated", "Widowed", "Rather not say"]

Gender = Literal["Male", "Femal", "Rather not say"]


class StaticPatientData(TimestampMixin, Base):
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    firstname: Mapped[str] = mapped_column(String)
    lastname: Mapped[str] = mapped_column(String)
    gender: Mapped[Gender] = mapped_column(Enum(*get_args(Gender)))
    nickname: Mapped[str] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime)
    marital_status: Mapped[MaritalStatus] = mapped_column(Enum(*get_args(MaritalStatus)))
    occupation: Mapped[str] = mapped_column(String)
    occupation_details: Mapped[str] = mapped_column(String)
    lifestyle_habits: Mapped[str] = mapped_column(String)
    psychosocial_history: Mapped[str] = mapped_column(String)
    contact_number: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    emergency_contact: Mapped[str] = mapped_column(String, nullable=True)
    dynamic_data: Mapped[List[DynamicData]] = relationship(
        "DynamicData", back_populates="patient", cascade="all, delete-orphan"
    )

    @property
    def age(self) -> int:
        today = datetime.now().date()
        dob = self.date_of_birth.date()
        years = today.year - dob.year
        if today < dob.replace(year=today.year):
            years -= 1
        return years

    @property
    def fullname(self) -> str:
        return f"{self.firstname} {self.lastname}"


class DynamicData(TimestampMixin, Base):
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("static_patient_data.id")
    )
    chief_complaint: Mapped[str] = mapped_column(String)
    past_medical_history: Mapped[str] = mapped_column(String)
    family_medical_history: Mapped[str] = mapped_column(String)
    allergies: Mapped[str] = mapped_column(String)
    medications: Mapped[str] = mapped_column(String)
    dietary_preferences: Mapped[str] = mapped_column(String)
    exercise_routine: Mapped[str] = mapped_column(String)
    patient: Mapped[StaticPatientData] = relationship(
        "StaticPatientData", back_populates="dynamic_data"
    )

    @property
    def patient_name(self) -> str:
        return self.patient.fullname

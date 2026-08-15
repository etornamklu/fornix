from __future__ import annotations

from typing import Dict, List, Literal, Optional, get_args, TYPE_CHECKING
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, UUID, Enum, Date, ForeignKey, Integer
from sqlalchemy.dialects import postgresql as pg
import uuid
from datetime import date, datetime
from . import Base, TimeStampMixin #, TimestampMixin

if TYPE_CHECKING:
    from .user import User





MaritalStatus = Literal["Single", "Married", "Divorced", "Separated", "Widowed", "Rather not say"]

Gender = Literal["Male", "Female", "Rather not say"]


class PersonalInformation(TimeStampMixin):
    __tablename__ = "personal_information"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    firstname: Mapped[str] = mapped_column(String)
    lastname: Mapped[str] = mapped_column(String)
    nickname: Mapped[str] = mapped_column(String, nullable=True)
    gender: Mapped[Gender] = mapped_column(pg.ENUM(*get_args(Gender), name="gender"))
    address: Mapped[str] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date)
    date_of_admission: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="personal_information")

    @property
    def age(self) -> int:
        today = datetime.now().date()
        dob = self.date_of_birth
        years = today.year - dob.year
        if today < dob.replace(year=today.year):
            years -= 1
        return years
    
    @property
    def fullname(self) -> str:
        return f"{self.firstname} {self.lastname}"



class FamilyHistory(TimeStampMixin):
    __tablename__ = "family_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    family_members: Mapped[List[Dict]] = mapped_column(pg.JSONB)
    hereditary_conditions: Mapped[Optional[List[str]]] = mapped_column(pg.JSONB, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="family_history")


class SocialHistory(TimeStampMixin):
    __tablename__ = "social_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    marital_status: Mapped[Optional[MaritalStatus]] = mapped_column(pg.ENUM(*get_args(MaritalStatus), name="marital_status"), nullable=True)
    partner_health: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    number_of_children: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    children_health: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    financial_worries: Mapped[Optional[Literal["Yes", "No"]]] = mapped_column(pg.ENUM("Yes", "No", name="financial_worries"), nullable=True)
    smoking_history: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    alcohol_history: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    travel_history: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    pets: Mapped[Optional[List[str]]] = mapped_column(pg.JSONB, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="social_history")


class ChiefComplaint(TimeStampMixin):
    __tablename__ = "chief_complaint"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    presenting_complaints: Mapped[List[str]] = mapped_column(pg.JSONB)
    hpc: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="chief_complaint")


class MedicalHistory(TimeStampMixin):
    __tablename__ = "medical_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    general: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    medical: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    surgical: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    obstetric_gynecological: Mapped[Optional[Dict]] = mapped_column(pg.JSONB, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="medical_history")


class SystemicEnquiry(TimeStampMixin):
    __tablename__ = "systemic_enquiry"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    respiratory_symptoms: Mapped[List[str]] = mapped_column(pg.JSONB, default=list)
    chest_issues: Mapped[Optional[Literal["Yes", "No"]]] = mapped_column(pg.ENUM("Yes", "No", name="chest_issues"), nullable=True)
    appetite_weight_changes: Mapped[Optional[Literal["Yes", "No"]]] = mapped_column(pg.ENUM("Yes", "No", name="appetite_weight_changes"),nullable=True)
    gastrointestinal_symptoms: Mapped[Optional[List[str]]] = mapped_column(pg.JSONB, nullable=True)
    urinary_issues: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sexual_health: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    musculoskeletal_issues: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    neurological_symptoms: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    psychological_symptoms: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="systemic_enquiry")


class DrugHistoryAndAllergies(TimeStampMixin):
    __tablename__ = "drug_history_and_allergies"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    medicines: Mapped[Optional[List[Dict]]] = mapped_column(pg.JSONB, nullable=True)
    therapies: Mapped[Optional[List[Dict]]] = mapped_column(pg.JSONB, nullable=True)
    allergies: Mapped[Optional[List[Dict]]] = mapped_column(pg.JSONB, nullable=True)
    upset_medicines: Mapped[Optional[List[Dict]]] = mapped_column(pg.JSONB, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="drug_history_and_allergies")



# class PatientStaticData(TimeStampMixin):
#     __tablename__ = "patient_static_data"
#     id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     personal_details: Mapped["PersonalInformation"] = relationship("PersonalInformation", uselist=False, back_populates="patient")
#     family_history: Mapped["FamilyHistory"] = relationship("FamilyHistory", uselist=False, back_populates="patient")
#     social_history: Mapped["SocialHistory"] = relationship("SocialHistory", uselist=False, back_populates="patient")
#     user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
#     user: Mapped["User"] = relationship("User", back_populates="patient")

#     @property
#     def age(self) -> int:
#         today = datetime.now().date()
#         dob = self.personal_details.date_of_birth
#         years = today.year - dob.year
#         if today < dob.replace(year=today.year):
#             years -= 1
#         return years
    
#     @property
#     def fullname(self) -> str:
#         return f"{self.personal_details.firstname} {self.personal_details.lastname}"


# class PatientStaticData(TimeStampMixin):
#     __tablename__ = "patient_static_data"


#     id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     firstname: Mapped[str] = mapped_column(String)
#     lastname: Mapped[str] = mapped_column(String)
#     gender: Mapped[Gender] = mapped_column(pg.ENUM(*get_args(Gender), name="gender"))
#     nickname: Mapped[str] = mapped_column(String, nullable=True)
#     address: Mapped[str] = mapped_column(String)
#     date_of_birth: Mapped[date] = mapped_column(Date)
#     marital_status: Mapped[MaritalStatus] = mapped_column(pg.ENUM(*get_args(MaritalStatus), name="marital_status"))
#     occupation: Mapped[str] = mapped_column(String)
#     occupation_details: Mapped[str] = mapped_column(String)
#     lifestyle_habits: Mapped[str] = mapped_column(String)
#     psychosocial_history: Mapped[str] = mapped_column(String)
#     contact_number: Mapped[str] = mapped_column(String)
#     emergency_contact: Mapped[str] = mapped_column(String, nullable=True)

#     patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
#     user: Mapped["User"] = relationship("User", back_populates="patient", uselist=False)

#     @property
#     def age(self) -> int:
#         today = datetime.now().date()
#         dob = self.date_of_birth
#         years = today.year - dob.year
#         if today < dob.replace(year=today.year):
#             years -= 1
#         return years

#     @property
#     def fullname(self) -> str:
#         return f"{self.firstname} {self.lastname}"



# class PatientDynamicData(TimeStampMixin):
#     __tablename__ = "patient_dynamic_data"

#     id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     presenting_complaints: Mapped[str] = mapped_column(String, nullable=True)
#     hpc: Mapped[dict] = mapped_column(pg.JSONB, nullable=True)
#     previous_illnesses: Mapped[Optional[List[str]]] = mapped_column(pg.JSONB, nullable=True)
#     # MedicalHistory
#     medical: Mapped[List[Dict]] = mapped_column(pg.JSONB, nullable=True)
    
#     # Surgical
#     surgeries: Mapped[Optional[List[str]]] = mapped_column(pg.JSONB, nullable=True)
#     past_medical_history: Mapped[str] = mapped_column(String)
#     family_medical_history: Mapped[str] = mapped_column(String)
#     allergies: Mapped[str] = mapped_column(String)
#     medications: Mapped[str] = mapped_column(String)
#     dietary_preferences: Mapped[str] = mapped_column(String)
#     exercise_routine: Mapped[str] = mapped_column(String)
#     patient_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), ForeignKey("users.id")
#     )
#     user: Mapped["User"] = relationship("User", back_populates="dynamic_data")

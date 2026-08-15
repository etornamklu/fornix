"""database model"""

import random
import string
import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Column, String, UUID, Boolean, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import relationship

from src.database.models import Base
from src.database.models.doctor_dashboard_diagnosis import DoctorDashboardDiagnosis
from src.database.models.user_connections import UserConnections
from .chat_message import ChatMessage
from .chat_session import ChatSession

if TYPE_CHECKING:
    from .patient_data import (
        PersonalInformation,
        FamilyHistory,
        SocialHistory,
        ChiefComplaint,
        MedicalHistory,
        SystemicEnquiry,
        DrugHistoryAndAllergies,
    )


def generate_user_code():
    """Generate an 8-character alphanumeric code."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


class User(Base):
    """users model"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    auth_id = Column(String, nullable=True)  # for external auth such as google
    name = Column(String)
    email = Column(String, index=True)
    credits = Column(Float, default=0.0)
    password = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    role = Column(String, default="user")
    logged_in = Column(Boolean, default=False)
    free_trial = Column(Boolean, default=False)
    user_code = Column(String, unique=True, default=generate_user_code, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), index=True)

    personal_information: Mapped["PersonalInformation"] = relationship(
        "PersonalInformation",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    family_history: Mapped["FamilyHistory"] = relationship(
        "FamilyHistory",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    social_history: Mapped["SocialHistory"] = relationship(
        "SocialHistory",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    chief_complaint: Mapped[List["ChiefComplaint"]] = relationship(
        "ChiefComplaint",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    medical_history: Mapped[List["MedicalHistory"]] = relationship(
        "MedicalHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    systemic_enquiry: Mapped[List["SystemicEnquiry"]] = relationship(
        "SystemicEnquiry",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    drug_history_and_allergies: Mapped[List["DrugHistoryAndAllergies"]] = relationship(
        "DrugHistoryAndAllergies",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    billing_history = relationship(
        "BillingHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    diagnoses_created: Mapped["DoctorDashboardDiagnosis"] = relationship(
        "DoctorDashboardDiagnosis",
        back_populates="doctor",
        foreign_keys=[DoctorDashboardDiagnosis.doctor_id],
        cascade="all, delete-orphan"
    )

    diagnoses_received: Mapped["DoctorDashboardDiagnosis"] = relationship(
        "DoctorDashboardDiagnosis",
        back_populates="patient",
        foreign_keys=[DoctorDashboardDiagnosis.patient_id],
        cascade="all, delete-orphan"
    )

    # chat_history: Mapped[List["ChatHistory"]] = relationship(
    #     "ChatHistory",
    #     back_populates="user",
    #     cascade="all, delete-orphan"
    # )

    sent_requests = relationship(
        "UserConnections",
        back_populates="doctor",
        foreign_keys=[UserConnections.sender_id],
        cascade="all, delete-orphan"
    )

    received_requests = relationship(
        "UserConnections",
        back_populates="patient",
        foreign_keys=[UserConnections.receiver_id],
        cascade="all, delete-orphan"
    )

    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        "ChatSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    chat_messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="user",
        cascade="all, delete-orphan"
    )

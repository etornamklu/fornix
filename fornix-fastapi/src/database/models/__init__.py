"""..."""

from datetime import datetime
from sqlalchemy import Column, func, DateTime

# to render models into db import them all here

from sqlalchemy.orm import declarative_base

Base = declarative_base()


class TimeStampMixin(Base):
    __abstract__ = True
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


# from .patient_data import PatientStaticData
# from .patient_dynamic_data import PatientDynamicData
from .patient_data import (
    FamilyHistory,
    SocialHistory,
    PersonalInformation,
    ChiefComplaint,
    MedicalHistory,
    SystemicEnquiry,
    DrugHistoryAndAllergies,
)
from .payment import Payment
from .user import User
from .password_reset_token import PasswordResetToken
from .doctor_dashboard_diagnosis import DoctorDashboardDiagnosis
from .billing_history import BillingHistory
from .recording import Report, ProcessingJob
from .user_connections import UserConnections
from .langgraph_checkpointer import (
    Checkpoints,
    CheckpointBlobs,
    CheckpointWrites,
    CheckpointMigrations,
)
from .thread_ids import ThreadId
from .credit import CreditConstants
from .chat_message import ChatMessage
from .chat_session import ChatSession
from .doctor import DoctorReport
from .radiologist import RadiologistReport
from .files import AudioUpload, ImageUpload
from .organization import Organization, OrganizationInvitations

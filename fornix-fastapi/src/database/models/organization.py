import enum
import uuid

from sqlalchemy import Enum, String, ForeignKey, UUID, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from src.database.models import TimeStampMixin


class ConnectionAccessType(enum.Enum):
    all = "all"
    restricted = "restricted"
    multiple = "multiple"

class CreditUsageType(enum.Enum):
    pool = "pool"
    role = "role"
    individual = "individual"

class InvitationsStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
    expired = "expired"


class Organization(TimeStampMixin):
    __tablename__ = "organizations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    credits: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    credit_usage_type: Mapped[CreditUsageType] = mapped_column(Enum(CreditUsageType), nullable=False, default=CreditUsageType.pool)
    connection_access: Mapped[ConnectionAccessType] = mapped_column(Enum(ConnectionAccessType), default=ConnectionAccessType.all, nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    profile_picture_id:  Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("image_uploads.id"), nullable=True)

class OrganizationInvitations(TimeStampMixin):
    __tablename__ = "organization_invitations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    user_email: Mapped[str] = mapped_column(String, index=True, nullable=False)
    user_role: Mapped[str] = mapped_column(String, nullable=False)
    invitation_status: Mapped[InvitationsStatus] = mapped_column(Enum(InvitationsStatus), nullable=False, default=InvitationsStatus.pending, index=True)
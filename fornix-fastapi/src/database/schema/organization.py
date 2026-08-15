from enum import Enum
from uuid import UUID

from datetime import datetime
from pydantic import BaseModel

from src.database.schema.user import UserRole


class ConnectionAccess(str, Enum):
    all = "all"
    restricted = "restricted"
    multiple = "multiple"

class CreditUsage(str, Enum):
    pool = "pool"
    role = "role"
    individual = "individual"

class InvitationsStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
    expired = "expired"

class RoleCredit(BaseModel):
    doctor: float | None = None
    radiologist: float | None = None
    pharmacy: float | None = None

class DistributeCreditsCreate(BaseModel):
    role_credit: RoleCredit | None = None
    user: float | None = None


class OrganizationCreate(BaseModel):
    name: str
    description: str
    credit_usage_type: CreditUsage = CreditUsage.pool
    connection_access: ConnectionAccess = ConnectionAccess.all
    profile_picture_id: UUID | None = None

class OrganizationPublic(OrganizationCreate):
    id: UUID
    credits: float
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    credit_usage_type: CreditUsage | None = None
    connection_access: ConnectionAccess | None = None
    owner_id: UUID | None = None
    profile_picture_id: UUID | None = None


class OrganizationInvitationCreate(BaseModel):
    name: str
    email: str
    role: UserRole

class OrganizationInvitationPublic(OrganizationInvitationCreate):
    id: UUID
    invitation_status: InvitationsStatus = InvitationsStatus.pending
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
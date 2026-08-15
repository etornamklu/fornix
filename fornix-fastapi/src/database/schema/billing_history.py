from pydantic import BaseModel
from datetime import date, datetime
from enum import Enum
from uuid import UUID
from typing import Optional


# Enums for status and plan type
class StatusEnum(str, Enum):
    processing = "PROCESSING"
    success = "SUCCESS"
    failed = "FAILED"


class PlanTypeEnum(str, Enum):
    regular = "regular"
    standard = "standard"
    premium = "premium"


# Base model for billing history
class BillingHistoryBase(BaseModel):
    status: StatusEnum

    class Config:
        from_attributes = True


# Model for creating billing history (if needed)
class BillingHistoryCreate(BillingHistoryBase):
    pass


# Response model for billing history
class BillingHistoryResponse(BaseModel):
    id: UUID
    created_at: datetime
    status: StatusEnum
    amount: float
    plan: Optional[PlanTypeEnum] = None
    credits: int

    class Config:
        from_attributes = True

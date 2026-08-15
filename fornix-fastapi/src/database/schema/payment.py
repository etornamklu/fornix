from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
import enum
from src.database.models.payment import PlanTypeEnum


class PaymentCreate(BaseModel):
    reference: str = "T665843717594879"
    transaction: str = "3797491518"
    trxref: str = "T665843717594879"
    amount: int = 250

    class Config:
        use_enum_values = True


class PaymentBase(PaymentCreate):
    user_id: str | UUID
    name: str | None = None
    email: str | None = None


class PaymentSchema(PaymentCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

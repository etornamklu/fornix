from datetime import datetime
import uuid
from sqlalchemy import UUID, Column, DateTime, Float, String, ForeignKey, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
import enum
from src.database.models import Base


class PlanTypeEnum(enum.Enum):
    regular = "regular"
    standard = "standard"
    premium = "premium"


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_type: Mapped[PlanTypeEnum] = mapped_column(
        Enum(PlanTypeEnum, name="plan_type_enum"), unique=True, nullable=False
    )

    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="plan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True, index=True)
    user_id = Column(String)
    name = Column(String)
    email = Column(String)
    reference = Column(String)
    transaction = Column(String)
    trxref = Column(String)
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan_type = Column(
        Enum(PlanTypeEnum, name="plan_type_enum"),
        ForeignKey("plans.plan_type"),
        nullable=True,
    )
    plan = relationship("Plan", back_populates="payments")
    billing_histories = relationship("BillingHistory", back_populates="payment")

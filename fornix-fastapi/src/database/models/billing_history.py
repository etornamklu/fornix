from sqlalchemy import Column, Integer, String, Float, Date, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from src.database.models import Base, TimeStampMixin
from src.database.models.payment import PlanTypeEnum
from sqlalchemy import UUID
import enum
import uuid


class StatusEnum(enum.Enum):
    processing = "PROCESSING"
    success = "SUCCESS"
    failed = "FAILED"


class BillingHistory(TimeStampMixin, Base):
    __tablename__ = "billing_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(Enum(StatusEnum))
    amount = Column(Float)
    credits = Column(Float)
    payment_id = Column(UUID(as_uuid=True), ForeignKey('payments.id'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"))
    plan = Column(String, nullable=False)

    # Relationships
    user = relationship("User", back_populates="billing_history")
    payment = relationship("Payment", back_populates="billing_histories")

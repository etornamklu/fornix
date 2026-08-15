import uuid
from enum import Enum

from sqlalchemy import Column, UUID, ForeignKey, String
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import relationship

from src.database.models import Base, TimeStampMixin


class RequestStatusEnum(Enum):
    PENDING = 'PENDING'
    ACCEPTED = 'ACCEPTED'
    REJECTED = 'REJECTED'


class UserConnections(TimeStampMixin, Base):
    __tablename__ = 'user_connections'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    connection_status = Column(ENUM(RequestStatusEnum), default=RequestStatusEnum.PENDING)
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    receiver_user_code = Column(String, nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    doctor = relationship(
        "User",
        foreign_keys=[sender_id],
        back_populates="sent_requests",
        lazy="select",
    )

    patient = relationship(
        "User",
        foreign_keys=[receiver_id],
        back_populates="received_requests",
        lazy="select",
    )

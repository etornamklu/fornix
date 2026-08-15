import uuid
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, PrimaryKeyConstraint, UUID, DateTime
from src.database.models import Base


class ThreadId(Base):
    __tablename__ = "thread_ids"

    thread_id: Mapped[str] = mapped_column(String)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE")  # Enable cascade deletion
    )
    type: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.now)

    __table_args__ = (PrimaryKeyConstraint("thread_id", "patient_id"),)

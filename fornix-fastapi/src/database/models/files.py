import uuid

from sqlalchemy import LargeBinary, String, ForeignKey, UUID, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.models import TimeStampMixin


class ImageUpload(TimeStampMixin):
    __tablename__ = "image_uploads"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    radiologist_report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("radiologist_reports.id", ondelete="SET NULL"), nullable=True
    )
    lab_report_id: Mapped[uuid.UUID] = mapped_column(UUID(
        as_uuid=True), ForeignKey("lab_reports.id", ondelete="SET NULL"), nullable=True
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    # user = relationship("User", back_populates="image_uploads")

class AudioUpload(TimeStampMixin):
    __tablename__ = "audio_uploads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str] = mapped_column(String, nullable=True)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    processing_jobs: Mapped["ProcessingJob"] = relationship(
        "ProcessingJob", back_populates="audio_upload"
    )

    __table_args__ = (UniqueConstraint("user_id", "filename"),)
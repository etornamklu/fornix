import uuid
from datetime import datetime, timedelta

from sqlalchemy import Column, UUID, String, DateTime, func

from src.database.models import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email: str = Column(String, index=True)
    created_at: datetime = Column(DateTime(timezone=False), server_default=func.now())

    EXPIRATION_PERIOD = timedelta(minutes=5)

    def has_expired(self) -> bool:
        """Check if the token has expired."""
        now = datetime.now()
        token_expiration = self.created_at + self.EXPIRATION_PERIOD
        return now > token_expiration

from src.database.models import TimeStampMixin, Base
import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

# chat_type_enum = Enum("doc_gpt", "patient_gpt", name="chat_type")

class ChatSession(TimeStampMixin, Base):
    __tablename__ = "chat_session"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True)
    session_id = Column(String, unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(String, default="doc_gpt")

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<ChatSession(session_id={self.session_id}, user_id={self.user_id})>"

    def __str__(self):
        return self.__repr__()

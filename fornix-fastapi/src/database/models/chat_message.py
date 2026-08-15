import json
import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from src.database.models import TimeStampMixin, Base

#chat_type_enum = Enum("doc_gpt", "patient_gpt", name="chat_type")

class ChatMessage(TimeStampMixin, Base):
    __tablename__ = "chat_message"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, ForeignKey("chat_session.session_id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    message = Column(Text)
    type = Column(String, default="doc_gpt")

    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User")

    def __repr__(self):
        return f"<ChatMessage(session_id={self.session_id}, user_id={self.user_id}, type={self.type})>"

    def __str__(self):
        return self.__repr__()
    
    def get_message(self):
        if self.type == "patient_gpt":
            return json.loads(self.message) if self.message else None
        return self.message

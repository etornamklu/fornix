import json
from datetime import datetime
from typing import Any, List, Optional
from sqlalchemy.orm.session import Session
from langchain.schema import BaseMessage
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import messages_from_dict, message_to_dict

# Import the new models
from src.database.models.chat_session import ChatSession
from src.database.models.chat_message import ChatMessage


class MessageConverter:
    def __init__(self, message_model=ChatMessage):
        self.message_model = message_model

    """Convert BaseMessage to/from the SQLAlchemy model using ChatMessage."""

    def from_sql_model(self, sql_message: Any) -> BaseMessage:
        # Converts the stored JSON back into a BaseMessage.
        return messages_from_dict([json.loads(sql_message.message)])[0]

    def to_sql_model(
            self,
            message: BaseMessage,
            session_id: str,
            user_id: str,
            chat_type: str = "doc_gpt",
    ) -> Any:
        # Creates a ChatMessage instance from the BaseMessage.
        return self.message_model(
            session_id=session_id,
            user_id=user_id,
            type=chat_type,
            message=json.dumps(message_to_dict(message)),
        )

    def get_sql_model_class(self) -> Any:
        return self.message_model


class ChatHistoryManager(BaseChatMessageHistory):
    """
    Chat message history stored in an SQL database using the new ChatSession and ChatMessage models.
    It ensures a ChatSession exists for the given session_id and user_id.
    """

    def __init__(
            self,
            session_id: str,
            user_id: str,
            db_session: Session,
            session_id_field_name: str = "session_id",
            user_id_field_name: str = "user_id",
            chat_type: str = "doc_gpt",
            custom_message_converter: Optional[MessageConverter] = None,
    ):
        self.session_id_field_name = session_id_field_name
        self.user_id_field_name = user_id_field_name
        self.converter = custom_message_converter or MessageConverter()
        self.sql_model_class = self.converter.get_sql_model_class()
        if not hasattr(self.sql_model_class, session_id_field_name):
            raise ValueError("SQL model class must have a session_id column")
        if not hasattr(self.sql_model_class, user_id_field_name):
            raise ValueError("SQL model class must have a user_id column")

        self.session_id = session_id
        self.user_id = user_id
        self.chat_type = chat_type
        self.session = db_session

        # Ensure a ChatSession exists for this session_id and user_id.
        with self.session as session:
            existing_session = (
                session.query(ChatSession)
                .filter(
                    ChatSession.session_id == session_id,
                    ChatSession.user_id == user_id,
                )
                .first()
            )
            if not existing_session:
                new_session = ChatSession(
                    session_id=session_id,
                    user_id=user_id,
                    name=f"Untitled {datetime.now().strftime('%d-%m-%Y %H:%M')}",  # or set a default name if desired
                )
                session.add(new_session)
                session.commit()

    @property
    def messages(self) -> List[BaseMessage]:
        """Retrieve all messages for the current session and user."""
        with self.session as session:
            query_result: Any = (
                session.query(self.sql_model_class)
                .filter(
                    getattr(self.sql_model_class, self.session_id_field_name)
                    == self.session_id,
                    getattr(self.sql_model_class, self.user_id_field_name)
                    == self.user_id,
                    self.sql_model_class.type == self.chat_type,
                )
                .order_by(self.sql_model_class.id.asc())
            )
            messages_list = []
            for record in query_result:
                messages_list.append(self.converter.from_sql_model(record))
            return messages_list

    def add_message(self, message: BaseMessage) -> None:
        """Append a new message to the database."""
        with self.session as session:
            sql_model = self.converter.to_sql_model(
                message, self.session_id, self.user_id, self.chat_type
            )
            session.add(sql_model)
            session.commit()

    def clear(self) -> None:
        """Clear all messages for the current session and user from the database."""
        with self.session as session:
            session.query(self.sql_model_class).filter(
                getattr(self.sql_model_class, self.session_id_field_name)
                == self.session_id,
                getattr(self.sql_model_class, self.user_id_field_name)
                == self.user_id,
                self.sql_model_class.type == self.chat_type,
            ).delete()
            session.commit()

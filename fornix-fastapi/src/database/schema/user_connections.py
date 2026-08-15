from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class GetUserInfoSchema(BaseModel):
    user_code: str = ""


class RequestConnectionSchema(BaseModel):
    user_code: str = ""


class UserConnectionsUserSchema(BaseModel):
    id: UUID
    user_code: str
    name: str
    role: str
    email: str

    class Config:
        from_attributes = True


class UserConnectionsSchema(BaseModel):
    id: UUID
    connection_status: str
    receiver_user_code: str
    created_at: datetime
    doctor: Optional[UserConnectionsUserSchema]
    patient: Optional[UserConnectionsUserSchema]

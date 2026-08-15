import enum
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel



class UserRole(str, enum.Enum):
    USER = "user"
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    PHARMACY = "PHARMACY"
    RADIOLOGIST = "RADIOLOGIST"
    ADMIN = "ADMIN"
    NURSE = "NURSE"


class UserBase(BaseModel):
    name: str = "John Doe"
    email: str = "user@example.com"
    organization_id: Optional[UUID] = None
    role: UserRole = UserRole.USER
    free_trial: bool = False
    user_code: str = "XXXXXXXX"


class UserCreate(BaseModel):
    organization_id: Optional[UUID] = None
    role: UserRole | None = None
    name: str = "John Doe"
    email: str = "user@example.com"
    password: str = "rEVCDaAwt7"


class UserUpdate(BaseModel):
    name: Optional[str]
    old_password: Optional[str]
    new_password: Optional[str]


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserSchema(UserBase):
    id: UUID
    logged_in: bool
    credits: float
    profile_picture_url: Optional[str]

    class Config:
        from_attributes = True


class UserSignin(BaseModel):
    email: str = "user@example.com"
    password: str = "3Bqc6OM8c5FkH2c"


class UserDelete(BaseModel):
    email: str
    password: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str

    class Config:
        frozen = True


class TokenData(BaseModel):
    role: str | None = None
    user_id: UUID | None = None
    organization_id: UUID | None = None
    name: str | None = None
    email: str | None = None


class GoogleUser(BaseModel):
    id: str
    email: str
    verified_email: bool
    name: str
    given_name: str
    picture: str


class GoogleLinkAccountResponse(BaseModel):
    message: str
    user: UserSchema


class LinkToken(BaseModel):
    google_token: str
"""service for authentication of user"""

import os
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID
from fastapi import Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordBearer
from loguru import logger
import requests
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from starlette import status
from passlib.context import CryptContext
from dotenv import load_dotenv

# from src.database.database_connection import get_db
from src.database.models.user import User
from src.database.schema.user import (
    UserCreate,
    Token,
    TokenData,
    UserRoleUpdate,
    UserSchema,
    UserUpdate,
    GoogleUser,
)
from src.libraries.config import get_settings

load_dotenv()

settings = get_settings()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme_user = OAuth2PasswordBearer(tokenUrl="auth")


def get_user_google_url():
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope=openid%20profile%20email&access_type=offline"
    }


def get_user_google_data(google_token: str) -> GoogleUser:
    try:
        user_info = requests.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            headers={"Authorization": f"Bearer {google_token}"},
        )
        return GoogleUser(**user_info.json())
    except Exception as e:
        logger.error(f"Error getting user google data: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to get user google data",
        ) from e


def create_user(db: Session, user: UserCreate) -> tuple[User, Token]:
    """function for creating a user"""
    password_hash = pwd_context.hash(user.password)
    db_user = User(name=user.name, email=user.email, password=password_hash)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_token(db_user)
    return db_user, token

def create_org_user(db: Session, user: UserCreate) -> tuple[User, Token]:
    """function for creating a user for an org"""
    password_hash = pwd_context.hash(user.password)
    db_user = User(name=user.name, email=user.email, password=password_hash, role=user.role, organization_id=user.organization_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_token(db_user)
    return db_user, token


def create_google_user(db: Session, google_user: GoogleUser) -> tuple[User, Token]:
    """function for creating a google oauth user"""
    db_user = User(
        name=google_user.name,
        email=google_user.email,
        auth_id=google_user.id,
        profile_picture_url=google_user.picture,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_token(db_user)
    return db_user, token


def verify_password(plain_password, hash_password):
    """function for performing password verification"""
    return pwd_context.verify(plain_password, hash_password)


def get_user(db: Session, email: str):
    """function for retrieving a user by email"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    return user


def get_user_by_id(db: Session, user_id: str):
    """function for retrieving a user by id"""
    print(f"User ID: {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    return user


def authenticate_user(db: Session, email: str, password: str):
    """function for authenticating user email and password"""
    user = get_user(db, email)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user


def create_access_token(data: dict, expires_at: timedelta | None = None):
    """function for creating an access token"""
    body = data.copy()
    if expires_at:
        expire = datetime.now(timezone.utc) + expires_at
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    body.update({"exp": expire})
    encoded_jwt = jwt.encode(body, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_token(data: User) -> Token:
    access_token_expires = timedelta(minutes=int(settings.access_token_expire_minutes))

    access_token = create_access_token(
        data={
            "role": data.role,
            "user_id": str(data.id),
            'organization_id': str(data.organization_id) if data.organization_id else None,
            "name": data.name,
            "email": data.email,
        },
        expires_at=access_token_expires,
    )
    token = Token(access_token=access_token, token_type="bearer")
    return token


def google_login_request(db: Session, google_user: GoogleUser) -> tuple[User, Token]:
    """function for creating a new google user or logging in an existing google user"""
    existing_user = db.query(User).filter(User.email == google_user.email).first()
    if not existing_user:
        # sign me up
        user, token = create_google_user(db, google_user)
        return user, token

    # verify user
    if existing_user.auth_id != google_user.id:
        raise HTTPException(
            detail="Could not validate OAuth.", status_code=status.HTTP_401_UNAUTHORIZED
        )

    token = create_token(existing_user)
    return existing_user, token


def login_request(db: Session, email: str, password: str) -> tuple[Token, User]:
    """function for performing a login by a user"""
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user.logged_in = True
    db.commit()
    token = create_token(user)
    return token, user


def logout_request(token: TokenData, response: Response, db: Session) -> str:
    """function for performing a logout by a user"""
    try:
        # tokenConv = TokenData(**token)
        user = db.query(User).filter(User.id == token.user_id).first()
        user.logged_in = False
        db.commit()
        response.status_code = status.HTTP_202_ACCEPTED
        return "User Logged Out successfully"
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e) or "login failed"
        ) from e


def set_role(
        db: Session, req: UserRoleUpdate, user_id: str
) -> tuple[UserSchema, Token]:
    """function for setting a user's role"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if user.role == req.role.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a role",
        )
    user.role = req.role.value
    db.commit()
    db.refresh(user)
    token = create_token(user)
    return UserSchema(**user.__dict__), token


def update_user(db: Session, req: UserUpdate, user_id: str) -> tuple[UserSchema, Token]:
    """function for updating a user"""
    if req.old_password == req.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password and new password cannot be the same",
        )

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not verify_password(req.old_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password"
        )

    password_hash = pwd_context.hash(req.new_password)
    user.name = req.name
    user.password = password_hash
    db.commit()
    db.refresh(user)
    token = create_token(user)
    return UserSchema(**user.__dict__), token


def token_decoder(token: str):
    """function for decoding tokens"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        u_role: str = payload.get("role")
        u_id: str = payload.get("user_id")
        u_org: str = payload.get("organization_id")
        u_name: str = payload.get("name")
        u_email: str = payload.get("email")
        if u_id is None:
            raise credentials_exception
        token_data = TokenData(role=u_role, user_id=u_id, name=u_name, email=u_email, organization_id=u_org)
    except JWTError as exc:
        raise credentials_exception from exc
    return token_data


async def decode_token(token: Annotated[str, Depends(oauth2_scheme_user)]):
    """all users token decoder"""
    return token_decoder(token)


async def doctor_decode_token(token: Annotated[str, Depends(oauth2_scheme_user)]):
    """doctor's token decoder"""
    doctor = token_decoder(token)
    if doctor.role != "PHARMACY" and doctor.role != "DOCTOR":
        print(doctor.role)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    return doctor


async def patient_decode_token(token: Annotated[str, Depends(oauth2_scheme_user)]):
    """patient's token decoder"""
    patient = token_decoder(token)
    # print(patient)
    if patient.role != "PATIENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    return patient

async def radiologist_decode_token(token: Annotated[str, Depends(oauth2_scheme_user)]):
    """radiologist's token decoder"""
    radiologist = token_decoder(token)
    if radiologist.role != "RADIOLOGIST":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    return radiologist

async def admin_decode_token(token: Annotated[str, Depends(oauth2_scheme_user)]):
    """radiologist's token decoder"""
    admin = token_decoder(token)
    if admin.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    return admin


def set_auth_cookie(response: Response, token: str, key: str = "access-token"):
    environment = os.getenv("ENVIRONMENT", "Development")
    secure_flag = environment != "Development"

    response.set_cookie(
        key=key,
        value=token,
        httponly=True,
        max_age=43800 * 60,
        samesite="lax",
        secure=secure_flag,
    )
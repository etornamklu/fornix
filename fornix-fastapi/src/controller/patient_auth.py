# from passlib.context import CryptContext
# from datetime import datetime, timedelta, timezone
# from typing import Annotated, Tuple
# from uuid import UUID
# from fastapi import HTTPException, Response
# from sqlalchemy.orm import Session
# from jose import jwt, JWTError
# from starlette import status
# from passlib.context import CryptContext

# from src.database.models.patient_data import PatientStaticData
# from ..database.schema.doctor import Token
# import os
# from dotenv import load_dotenv

# load_dotenv()

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# def verify_password(plain_password, hash_password):
#     return pwd_context.verify(plain_password, hash_password)


# def get_patient(db: Session, email: str):
#     patient = (
#         db.query(PatientStaticData).filter(PatientStaticData.email == email).first()
#     )
#     if not patient:
#         return False
#     return patient


# def authenticate_patient(db: Session, email: str, password: str):
#     patient = get_patient(db, email)
#     if not patient:
#         return False
#     if not verify_password(password, patient.password):
#         return False
#     return patient


# def create_access_token(data: dict, expires_at: timedelta | None = None):
#     body = data.copy()
#     if expires_at:
#         expire = datetime.now(timezone.utc) + expires_at
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(minutes=60)
#     body.update({"exp": expire})
#     encoded_jwt = jwt.encode(
#         body, os.getenv("PATIENT_SECRET_KEY"), algorithm=os.getenv("ALGORITHM")
#     )
#     return encoded_jwt


# def login_patient(db: Session, email: str, password: str) -> tuple[Token, bool]:
#     patient = authenticate_patient(db, email, password)
#     if not patient:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     access_token_expires = timedelta(
#         minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
#     )
#     access_token = create_access_token(
#         data={
#             "user_id": str(patient.id),
#             "name": f"{patient.firstname.strip()} {patient.middle_name.strip()} {patient.lastname.strip()}",
#             "email": patient.email,
#         },
#         expires_at=access_token_expires,
#     )
#     return Token(access_token=access_token, token_type="bearer"), patient

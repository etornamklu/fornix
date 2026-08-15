"""module for auth endpoints"""

import json
import os
import uuid
from typing import Annotated, Optional
from uuid import uuid4

import httpx
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks, Header
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status

from src.controller.auth import (
    create_token,
    create_user,
    decode_token,
    get_user_google_data,
    get_user_google_url,
    google_login_request,
    login_request,
    logout_request,
    pwd_context,
    set_auth_cookie,
    set_role,
    update_user,
    verify_password,
)
from src.core.PatientDashboard.schema.patient_data_schema import StaticPatientData
from src.database.database_connection import get_db
from src.database.models.password_reset_token import PasswordResetToken

# from src.database.models.patient_data import PatientStaticData
from src.database.models.user import User
from src.database.schema.password import ChangePasswordSchema, ResetPasswordSchema
from src.database.schema.user import (
    GoogleLinkAccountResponse,
    GoogleUser,
    LinkToken,
    Token,
    TokenData,
    UserCreate,
    UserDelete,
    UserRoleUpdate,
    UserSchema,
    UserSignin,
    UserUpdate,
)
from src.services.email import (
    send_welcome_email,
    send_password_changed_email,
    send_password_reset_email,
)

oauth2_scheme = OAuth2AuthorizationCodeBearer(authorizationUrl="", tokenUrl="token")

router = APIRouter()


# Google SSO
@router.get("/get_oauth")
async def login_google():
    """Endpoint for requesting Google OAuth client url"""
    return get_user_google_url()


@router.get("/google")
async def auth_google(
    response: Response,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Endpoint for getting user info from google"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        token = authorization.split(" ")[1]
        google_user_info = get_user_google_data(token)

        # login or sign up google user
        user, token = google_login_request(db, google_user_info)
        set_auth_cookie(response, token.access_token)
        resp = {
            "user": UserSchema(**user.__dict__),
        }

        return resp

    except HTTPException as hx:
        raise hx
    except Exception as e:
        print(e)
        raise HTTPException(
            detail=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.post("/sign_up")
async def sign_up(
    data: UserCreate,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """endpoint for performing user sign up"""
    is_existing_user = db.query(User).filter(User.email == data.email).first()
    if is_existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already exists"
        )
    db_user, token = create_user(db, data)

    set_auth_cookie(response, token.access_token)

    try:
        resp = {
            "user": UserSchema(**db_user.__dict__),
        }

        try:
            background_tasks.add_task(send_welcome_email, str(db_user.email))
        except Exception as e:
            print(e)

        response.status_code = status.HTTP_201_CREATED
        return resp

    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("")
def login_for_access_token(
    form_data: UserSignin, response: Response, db: Session = Depends(get_db)
):
    """endpoint for making a login request"""
    try:
        token, user = login_request(db, form_data.email, form_data.password)
        set_auth_cookie(response, token.access_token)
        resp = {
            "user": UserSchema(**user.__dict__),
        }

        return resp
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e) or "The user does not exist",
        ) from e


@router.patch("/set-role")
def update_user_role(
    update_role_dto: UserRoleUpdate,
    token: Annotated[TokenData, Depends(decode_token)],
    response: Response,
    db: Session = Depends(get_db),
):
    """endpoint for updating a user's role"""
    user_with_role, created_token = set_role(db, update_role_dto, str(token.user_id))
    set_auth_cookie(response, created_token.access_token)

    return {
        "message": "User role has been set successfully",
        "data": user_with_role,
    }


@router.patch("/update_user")
def update_user_details(
    req: UserUpdate,
    token: Annotated[TokenData, Depends(decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for updating a user's details"""
    response, created_token = update_user(db, req, token.user_id)

    set_auth_cookie(response, created_token.access_token)

    return {
        "message": "user updated successfully",
        "data": response,
    }


@router.patch("/update_name")
async def update_name(
    body: dict,
    token: Annotated[TokenData, Depends(decode_token)],
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        new_name = body["new_name"]
        if len(new_name) < 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name too short",
            )
        user = db.query(User).filter_by(id=token.user_id).first()
        user.name = new_name
        db.commit()
        db.refresh(user)
        token = create_token(user)

        set_auth_cookie(response, token.access_token)

        return {
            "message": "User has been updated successfully",
            "data": UserSchema(**user.__dict__),
        }
    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


# deprecated
# @router.get("/logged_in")
# def retrieve_logged_in_user(token: Annotated[TokenData,
# Depends(decode_token)],
#                             db: Session = Depends(get_db)):
#     """endpoint for retrieving the logged in user"""
#     user = db.query(User).filter(User.id == token.user_id).first()
#     query = select(PatientStaticData).filter(
#         PatientStaticData.patient_id == token.user_id)
#     patient_static_data = db.execute(query).scalar()
#     if not user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
#                             detail="User not found")
#     user_dict = UserSchema(**user.__dict__).__dict__
#     if user.role == "PATIENT":
#         user_dict.update({"static_data_status": "not completed"})
#
#     if patient_static_data:
#         data_res = StaticPatientData(**patient_static_data.__dict__).__dict__
#         completed = 0
#         for value in data_res.values():
#             if value:
#                 completed += 1
#         count = len(data_res.values())
#         percentage_done = round((completed / count) * 100)
#         user_dict.update({
#             "static_data_status":
#                 ("completed" if percentage_done == 100 else "not completed")
#         })
#     return {"user": user_dict}


@router.post("/logout")
async def logout(
    token: Annotated[TokenData, Depends(decode_token)],
    response: Response,
    db: Session = Depends(get_db),
):
    """endpoint for logging out"""
    try:
        res = logout_request(token, response, db)
        return {"message": res}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


@router.post("/password/change")
async def change_password(
    change_data: ChangePasswordSchema,
    token: Annotated[TokenData, Depends(decode_token)],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter_by(id=token.user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
            )

        if not verify_password(change_data.old_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Wrong existing password."
            )

        if len(change_data.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="New Password too short.",
            )

        new_password_hash = pwd_context.hash(change_data.new_password)
        user.password = new_password_hash
        db.commit()
        db.refresh(user)

        background_tasks.add_task(send_password_changed_email, str(user.email))

        return {"message": "Password change successful."}

    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/password/reset")
async def reset_password(
    reset_data: ResetPasswordSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    try:
        email = reset_data.email
        password = reset_data.password
        password_reset_token = reset_data.password_reset_token

        # check for password_reset_token
        # if provided, perform password reset
        # else send reset email

        if password_reset_token:
            try:
                str(uuid.UUID(password_reset_token, version=4) == password_reset_token)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid token.",
                )
            # token provided, validate first
            prt = (
                db.query(PasswordResetToken)
                .filter_by(token=password_reset_token)
                .first()
            )

            if not prt:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reset Token not found. Request new token.",
                )

            if prt.has_expired():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Reset Token expired. Request new token.",
                )

            if len(password) >= 8:
                user = db.query(User).filter_by(email=prt.email).first()
                pass_hash = pwd_context.hash(password)
                user.password = pass_hash
                # TODO: invalidate all existing tokens
                db.delete(prt)
                db.commit()
                db.refresh(user)
                background_tasks.add_task(send_password_changed_email, str(prt.email))
                return {"message": "Password reset successful."}

            else:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Password invalid. Use a different password.",
                )

        user = db.query(User).filter_by(email=email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"User {email} not found"
            )

        db.query(PasswordResetToken).filter_by(email=email).delete()

        token = str(uuid4())
        reset_token = PasswordResetToken(email=email, token=token)
        db.add(reset_token)
        db.commit()

        background_tasks.add_task(send_password_reset_email, email, token)

        return {"message": "Password reset email sent.", "prt": token}

    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)

    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.delete("/delete")
async def delete_account(
    del_data: UserDelete,
    token: Annotated[TokenData, Depends(decode_token)],
    db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter_by(id=token.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Handle regular user deletion
        if del_data.password:
            if user.email == del_data.email and verify_password(
                del_data.password, user.password
            ):
                db.delete(user)
                db.commit()
                return {"message": "user deleted"}
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Failed to delete. Wrong email or password."
            )

        if not user.auth_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account is not linked to Google. Please provide password for deletion."
            )

        if user.email == del_data.email:
            db.delete(user)
            db.commit()
            return {"message": "user deleted"}
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification failed"
        )

    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the account"
        )


@router.post("/link_google_account")
async def link_google_account(
    google_token: LinkToken, response: Response, db: Session = Depends(get_db)
):
    """Link Google account with an existing user"""
    try:
        google_user_info = get_user_google_data(google_token.google_token)
        if not google_user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token"
            )

        user = db.query(User).filter(User.email == google_user_info.email).first()

        # Check if the existing user is already linked to the Google account
        existing_user = (
            db.query(User).filter(User.auth_id == google_user_info.id).first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Google account already linked to an existing user",
            )

        # linking google account with existing user
        user.auth_id = google_user_info.id
        db.commit()
        db.refresh(user)

        # New token to login User
        token = create_token(user)
        set_auth_cookie(response, token.access_token)

        response_data = GoogleLinkAccountResponse(
            message="Google account successfully linked",
            user=UserSchema(**user.__dict__),
        )

        return response_data

    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )

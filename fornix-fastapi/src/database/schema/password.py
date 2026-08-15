from typing import Optional

from pydantic import BaseModel


class ResetPasswordSchema(BaseModel):
    """When password_reset_token is provided, perform password update, else send reset email"""

    email: Optional[str] = ""
    password: Optional[str] = ""
    password_reset_token: Optional[str] = ""


class ChangePasswordSchema(BaseModel):
    old_password: Optional[str]
    new_password: str

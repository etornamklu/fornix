"""doctor controllers"""

from sqlalchemy.orm import Session

from src.database.schema.user import TokenData, UserSchema
from src.database.models.user import User


def online_doctors(db: Session, __token: TokenData, skip: int = 0, limit: int = 100):
    """function for retrieving all online doctors"""
    doctors = (
        db.query(User)
        .filter(User.role == "DOCTOR" and User.logged_in is True)
        .offset(skip)
        .limit(limit)
        .all()
    )
    wrapped_online_doctors = [UserSchema(**doctor.__dict__) for doctor in doctors]
    return len(wrapped_online_doctors), wrapped_online_doctors

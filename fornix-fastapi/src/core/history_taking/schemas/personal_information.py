from langchain_core.pydantic_v1 import BaseModel, Field
from datetime import date
from enum import Enum
from typing import Optional
from .base import BaseSchema


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    NOT_SAY = "Rather not say"


class PersonalInformation(BaseSchema):
    firstname: str = Field(..., description="First name of the patient.")
    lastname: str = Field(..., description="Last name of the patient.")
    gender: Gender = Field(
        None, description="Gender of the patient. Don't ask if not you can infer it."
    )
    address: Optional[str] = Field(None, description="Residential address.")
    date_of_birth: date = Field(..., description="Date of birth")
    additional_info: Optional[str] = Field(
        None,
        description="Any other details you consider relevant and should be included in the history.",
    )

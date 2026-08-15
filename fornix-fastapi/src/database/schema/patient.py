from pydantic import BaseModel
from typing import Literal, Optional, Annotated
from datetime import date


class StaticDataDto(BaseModel):
    patient_id: str
    firstname: str
    middle_name: Optional[str] = ""
    lastname: str
    marital_status: Literal[
        "Single", "Married", "Divorced", "Separated", "Widowed", "Rather not say"
    ]
    gender: Literal["Male", "Female", "Rather not say"]
    date_of_birth: date
    occupation: Optional[str] = ""
    # height: str
    # blood_group: str

    class Config:
        from_attributes = True

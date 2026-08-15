from typing import List, Literal, Dict, Optional, Annotated
import operator
from datetime import date
import re
from uuid import UUID

from pydantic import BaseModel as BaseModel2
from pydantic import field_validator as validator2


class StaticPatientData(BaseModel2):
    id: UUID
    patient_id: UUID
    level: str
    nickname: Optional[str] = ""
    date_of_birth: Optional[date] = ""
    gender: Literal["Male", "Female", "Rather not say"] = ""

    marital_status: Optional[
        Literal[
            "Single", "Married", "Divorced", "Separated", "Widowed", "Rather not say"
        ]
    ]
    occupation: Optional[str]
    occupation_details: Optional[str]

    address: Optional[str]
    contact_number: Optional[str]
    emergency_contact: Optional[List[str]]

    previous_surgeries: Optional[str]
    allergies: Optional[str]
    medications: Optional[str]
    family_medical_history: Optional[str]

    lifestyle_habits: Optional[str]
    dietary_habits: Optional[str]
    exercise_routine: Optional[int]
    psychosocial_history: Optional[str]


class PatientDataSchema(StaticPatientData):
    patient_id: UUID
    chief_complaint: List | str = ""
    onset: str = ""
    location: str = ""
    timing: str = ""
    severity: float | int = 0.0
    exacerbating_factors: List | str = []
    relieving_factors: List | str = []
    associated_symptoms: List | str = []
    progression: str = ""
    episodes: Dict | str = ""
    impact_on_daily_life: Optional[str] = ""
    current_medications: List | Dict | str = []
    exposures: Optional[str] = ""
    psychological_factors: str = ""
    expectations: Optional[str | List] = ""
    additional_info: Annotated[List, operator.add] | str = []


class DynamicPatientData(BaseModel2):
    chief_complaint: List | str = ""
    onset: str = ""
    location: str = ""
    timing: str = ""
    severity: float | int = 0.0
    exacerbating_factors: List | str = []
    relieving_factors: List | str = []
    associated_symptoms: List | str = []
    progression: str = ""
    episodes: Dict | str = ""
    impact_on_daily_life: Optional[str] = ""
    current_medications: List | Dict | str = []
    exposures: Optional[str] = ""
    psychological_factors: str = ""
    expectations: Optional[str | List] = ""
    additional_info: Annotated[List, operator.add] | str = []


# class StaticPatientData(BaseModel2):
#     # firstname: str
#     # lastname: str
#     # middle_name: Optional[str] = ""
#     patient_id: str
#     nickname: Optional[str] = ""
#     date_of_birth: date
#     gender: Literal["Male", "Female", "Rather not say"]
#     marital_status: Literal[
#         "Single", "Married", "Divorced", "Separated", "Widowed", "Rather not say"
#     ]
#     occupation: Optional[str] = ""
#     home_address: Optional[str]
#     phone: Optional[str]
#     emergency_contact: Optional[str]
#     previous_surgeries: Optional[Dict | str]
#     allergies: Optional[List | Dict | str] = []
#     past_medical_history: Optional[str | List]
#     herbal_drug_use: Optional[str]
#     family_medical_history: Optional[List | Dict | str]
#     smoking: Optional[Dict | str]
#     alcohol: Optional[Dict | str]
#     recreational_drug_use: Optional[List | Dict | str]
#     previous_admissions: Optional[List | str | Dict]
#     previous_diagnoses: Optional[List | str]
#     previous_blood_transfusion: Optional[Literal["Yes", "No"]]
#     occupation_details: Optional[str]
#     diet: Optional[Dict | List | str]
#     exercise: Optional[str | List]
#     gynaecologic_history: Optional[Dict | str] = None

#     @validator2("phone", "emergency_contact", mode="before")
#     def phone_validation(cls, v):
#         """for validating phone number"""
#         regex = r"^(\+)[1-9][0-9\-\(\)\.]{9,15}$"
#         if v and not re.search(regex, v, re.I):
#             raise ValueError("Phone Number Invalid.")
#         return v

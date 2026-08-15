from datetime import date
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel


class PatientStaticFirst(BaseModel):
    nickname: Optional[str] = ""
    date_of_birth: Optional[date] = ""
    gender: Literal["Male", "Female", "Rather not say"] = ""


class PatientStaticSecond(BaseModel):
    marital_status: Optional[
        Literal[
            "Single", "Married", "Divorced", "Separated", "Widowed", "Rather not say"
        ]
    ]
    occupation: Optional[str]
    occupation_details: Optional[str]


class PatientStaticAddressPage(BaseModel):
    address: Optional[str]
    contact_number: Optional[str]
    emergency_contact: Optional[List[str]]


class PatientStaticMedicalHistory(BaseModel):
    previous_surgeries: Optional[str]
    allergies: Optional[str]
    medications: Optional[str]
    family_medical_history: Optional[str]


class PatientStaticHabits(BaseModel):
    lifestyle_habits: Optional[str]
    dietary_habits: Optional[str]
    exercise_routine: Optional[int]
    psychosocial_history: Optional[str]

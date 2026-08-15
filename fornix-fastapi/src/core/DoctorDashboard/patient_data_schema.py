from typing import Optional
from pydantic import BaseModel, Field


class PatientData(BaseModel):
    age: int = Field(description="Age of the patient")
    sex: str = Field(description="Sex of the patient")
    complaint: str = Field(description="Patient's chief complaint")
    history: str = Field(description="History of patients complaint")
    symptoms: str = Field(description="Symptoms of patients")
    studies: Optional[str] = Field(
        default=None, description="Findings from relevant studies. Eg. Lab, imaging etc"
    )
    med_history: Optional[str] = Field(
        default=None, description="Patient's medical history"
    )
    social_history: Optional[str] = Field(
        default=None, description="Patient's social history"
    )
    family_history: Optional[str] = Field(
        default=None,
        description="Family history of patient that may be relevant for patient's "
        "diagnosis",
    )


class PatientDataMod(BaseModel):
    age: str = Field(description="Age of the patient")
    sex: str = Field(description="Sex of the patient")
    complaint_and_duration: str = Field(
        description="Patient's chief complaint and the duration of the issue"
    )
    symptoms_history: str = Field(description="Symptoms history of patient's complaint")
    med_history: Optional[str] = Field(
        default=None, description="Patient's medical history"
    )
    social_family_history: Optional[str] = Field(
        default=None,
        description="Patient's social and family history that may be relevant for patient's"
        "diagnosis",
    )
    clinical_studies: Optional[str] = Field(
        default=None, description="Findings from relevant studies. Eg. Lab, imaging etc"
    )
    other_info: Optional[str] = None

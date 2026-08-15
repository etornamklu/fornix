from pydantic.v1 import BaseModel, Field, validator
from typing import Dict, Optional, List
from .base import BaseSchema


class General(BaseModel):
    previous_illnesses: Optional[List[str]] = Field(
        None, description="Details of previous illnesses"
    )

    @validator("previous_illnesses", pre=True)
    def validate_previous_illnesses(cls, v):
        return [v] if isinstance(v, str) else v


class MedicalHistory(BaseModel):
    critical_conditions: Optional[List[str]] = Field(
        None,
        description="List of medical conditions the patient has such as tb, hp, rf, epilepsy, asthma, diabetes_and_depression, anxiety_and_arthritis, cancer",
    )
    details: Optional[str] = Field(
        None, description="Details about each condition, keyed by condition name"
    )


class Surgical(BaseModel):
    surgeries: Optional[List[str]] = Field(
        None, description="List of surgeries the patient has had"
    )

    @validator("surgeries", pre=True)
    def validate_surgeries(cls, v):
        return [v] if isinstance(v, str) else v


class ObstetricGynecologicalHistory(BaseModel):
    menarche: Optional[int] = Field(None, description="Age at menarche")
    menopause: Optional[int] = Field(None, description="Age at menopause")
    menstrual_cycle: Optional[str] = Field(None, description="Details of menstrual cycle")
    pregnancies: Optional[int] = Field(None, description="Details of pregnancies")
    abortions: Optional[int] = Field(None, description="Details of abortions")
    deliveries: Optional[int] = Field(None, description="Details of deliveries")
    contraception: Optional[str] = Field(None, description="Details of contraception")
    std: Optional[str] = Field(
        None, description="Details of sexually transmitted diseases"
    )
    pelvic_pain: Optional[str] = Field(None, description="Details of pelvic pain")
    vaginal_discharge: Optional[str] = Field(
        None, description="Details of vaginal discharge"
    )
    bleeding: Optional[str] = Field(None, description="Details of abnormal bleeding")


class PreviousMedicalHistorySchema(BaseSchema):
    general: Optional[General] = Field(None, description="General medical history")
    medical: Optional[MedicalHistory] = Field(None, description="Medical history")
    surgical: Optional[Surgical] = Field(None, description="Surgical history")
    obstetric_gynecological: Optional[ObstetricGynecologicalHistory] = Field(
        None,
        description="Obstetric and gynecological history. Ignore if patient is a male",
    )
    additional_info: Optional[str] = Field(
        None,
        description="Any other details you consider relevant and should be included in the history.",
    )

    @validator("obstetric_gynecological", pre=True)
    def validate_obstetric_gynecological(cls, v):
        if not v:
            return None
        return v

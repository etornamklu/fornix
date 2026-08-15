from pydantic.v1 import BaseModel, Field
from typing import List, Optional
from .base import BaseSchema


class ExerbatingAndRelievingFactors(BaseModel):
    exacerbating_factors: Optional[List[str]] = Field(
        None, description="Factors that worsen the pain"
    )
    relieving_factors: Optional[List[str]] = Field(
        None, description="Factors that relieve the pain"
    )


class HPC(BaseModel):
    site: Optional[str] = Field(None, description="Site of the pain", min_length=1)
    onset: Optional[str] = Field(None, description="When the pain started", min_length=1)
    character: Optional[str] = Field(None, description="Characteristics of the pain", min_length=1)
    radiation: Optional[str] = Field(None, description="Whether the pain radiates to other areas", min_length=1)
    association: Optional[str] = Field(None, description="Any associated symptoms", min_length=1)
    timing: Optional[str] = Field(None, description="Timing of the pain", min_length=1)
    severity: Optional[float] = Field(
        None, description="Severity of the pain (e.g., scale of 0-10)"
    )
    exerbating_and_relieving_factors: Optional[ExerbatingAndRelievingFactors] = Field(
        None, description="Factors that worsen and relieve the pain"
    )


class ChiefComplaintSchema(BaseSchema):
    presenting_complaints: Optional[List[str] | str] = Field(
        None, description="Chief complaint(s) of the patient", min_length=1
    )
    hpc: Optional[HPC] = Field(None, description="History of Presenting Complaint(s)")
    additional_info: Optional[str] = Field(None, description="Any other details you consider relevant and should be included in the history.")

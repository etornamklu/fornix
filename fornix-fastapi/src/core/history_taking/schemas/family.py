from typing import List, Optional
from langchain_core.pydantic_v1 import BaseModel, Field
from .base import BaseSchema


class FamilyMember(BaseModel):
    relation: str = Field(
        ..., description="Relation to the patient (e.g., father, mother, brother)."
    )
    alive: bool = Field(..., description="Is the family member alive?")
    age: Optional[int] = Field(None, description="Current age or age at death.")
    cause_of_death: Optional[str] = Field(
        None, description="Cause of death if deceased."
    )
    current_illnesses: Optional[List[str]] = Field(
        None, description="List of current illnesses."
    )


class FamilyHistory(BaseSchema):
    family_members: Optional[List[FamilyMember]] = Field(
        None, description="Details of immediate family members."
    )
    hereditary_conditions: Optional[List[str]] = Field(
        None, description="Illnesses that run in the family."
    )
    additional_info: Optional[str] = Field(
        None,
        description="Any other details you consider relevant and should be included in the history.",
    )

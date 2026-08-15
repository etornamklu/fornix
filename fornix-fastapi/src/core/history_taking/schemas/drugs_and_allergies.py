from typing import List, Optional
from langchain_core.pydantic_v1 import BaseModel, Field
from .base import BaseSchema


class Medicine(BaseModel):
    name: Optional[str] = Field(
        None,
        description="Name of the drug, homoeopathic remedy, herbal medicine, or health food.",
    )
    dose: Optional[str] = Field(
        None, description="Dose and frequency if patient is taking a drug."
    )


class Therapy(BaseModel):
    type: Optional[str] = Field(None, description="Type of therapy")
    description: Optional[str] = Field(None, description="Details of the therapy")


class Allergy(BaseModel):
    allergen: Optional[str] = Field(None, description="Allergen causing the reaction")
    reaction: Optional[str] = Field(None, description="Reaction to the allergen")


class UpsetMedicine(BaseModel):
    name: Optional[str] = Field(None, description="Name of the problematic medicine.")
    reaction: Optional[str] = Field(None, description="Reaction to the medicine.")


class DrugHistoryAndAllergies(BaseSchema):
    medicines: Optional[List[Medicine]] = Field(
        None, description="List of drugs, herbal, or homoeopathic remedies."
    )
    therapies: Optional[List[Therapy]] = Field(
        None, description="List of therapies the patient is undergoing."
    )
    allergies: Optional[List[Allergy]] = Field(
        None, description="List of allergies and reactions."
    )
    upset_medicines: Optional[List[UpsetMedicine]] = Field(
        None, description="List of medicines causing adverse effects."
    )
    additional_info: Optional[str] = Field(
        None,
        description="Any other details you consider relevant and should be included in the history.",
    )

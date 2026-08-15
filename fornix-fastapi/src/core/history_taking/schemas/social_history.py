from langchain_core.pydantic_v1 import BaseModel, Field, root_validator
from typing import Literal, Optional, List
from enum import Enum

from .base import BaseSchema


class MaritalStatus(str, Enum):
    SINGLE = "Single"
    MARRIED = "Married"
    DIVORCED = "Divorced"
    SEPARATED = "Separated"
    WIDOWED = "Widowed"
    NOT_SAY = "Rather not say"


class SmokingHistory(BaseModel):
    currently_smokes: Optional[bool] = Field(None, description="Does the patient currently smoke?")
    amount_per_day_week: Optional[str] = Field(
        None, description="Amount smoked per day or week (if applicable)."
    )
    previously_smoked: Optional[bool] = Field(
        None, description="Has the patient smoked in the past?"
    )
    quit_reason: Optional[str] = Field(None, description="Reason for quitting smoking.")


class AlcoholHistory(BaseModel):
    drinks_alcohol: Optional[bool] = Field(None, description="Does the patient drink alcohol?")
    units_per_day_week: Optional[str] = Field(
        None, description="Alcohol consumption in units per day or week."
    )


class TravelHistory(BaseModel):
    has_traveled_abroad: Optional[bool] = Field(
        None, description="Has the patient traveled abroad?"
    )
    locations: Optional[List[str]] = Field(
        None, description="Countries or regions visited."
    )


class MobilityInfo(BaseModel):
    has_mobility_issues: Optional[bool] = Field(
        None, description="Does the patient have mobility issues?"
    )
    home_description: Optional[str] = Field(
        None,
        description="Description of the home layout, including stairs and facilities.",
    )


class SocialHistory(BaseSchema):
    marital_status: Optional[MaritalStatus] = Field(
        None, description="Marital status (e.g., single, married, widowed, divorced)."
    )
    partner_health: Optional[str] = Field(
        None, description="Health status of the partner (if applicable)."
    )
    number_of_children: Optional[int] = Field(None, description="Number of children.")
    children_health: Optional[str] = Field(
        None, description="Health status of the children."
    )
    occupation: Optional[str] = Field(None, description="Occupation of the patient.")
    financial_worries: Optional[Literal["Yes", "No"]] = Field(
        None, description="Does the patient have financial worries?"
    )
    smoking_history: Optional[SmokingHistory] = Field(
        None, description="Smoking history details."
    )
    alcohol_history: Optional[AlcoholHistory] = Field(
        None, description="Alcohol consumption details."
    )
    travel_history: Optional[TravelHistory] = Field(
        None, description="Details of travel abroad."
    )
    pets: Optional[List[str]] = Field(None, description="List of pets.")
    additional_info: Optional[str] = Field(
        None,
        description="Any other details you consider relevant and should be included in the history.",
    )

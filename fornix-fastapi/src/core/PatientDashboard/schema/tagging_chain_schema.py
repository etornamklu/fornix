from typing import List, Dict, Literal, Optional
from langchain.pydantic_v1 import BaseModel, Field, validator


class TaggingChainSchema(BaseModel):
    chief_complaint: List | str = Field(
        default="",
        description="The patient's main or presenting complaint",
    )
    onset: str = Field(
        default="",
        description="Onset and duration of the patient's illness",
    )
    location: str = Field(
        default="",
        description="Location of the patient's illness",
    )
    timing: str = Field(
        default="",
        description="Specific periods or circumstances in which the patient usually experience his "
        "complaint",
    )
    severity: float | int = Field(
        default=0.0,
        description="Severity of the patient's illness on a scale of 1-10",
    )
    exacerbating_factors: List | str = Field(
        default=[],
        description="Python list of exacerbating factors to the patient's illness",
    )
    relieving_factors: List | str = Field(
        default=[],
        description="Python list of relieving factors to the patient's illness",
    )
    associated_symptoms: List | str = Field(
        default=[],
        description="Python list of associated symptoms of the patient's illness",
    )
    progression: str = Field(
        default="",
        description="Whether the illness is worsening, staying the same or becoming better",
    )
    episodes: Dict | str = Field(
        default="",
        description="similar symptoms in the past? If yes, how he managed it?",
    )
    impact_on_daily_life: Optional[str] = Field(
        default="",
        description="The impact of the patient's illness on his daily life",
    )
    current_medications: List | Dict | str = Field(
        default=[],
        description="Python list of patient's Current medications in {key "
        ": value} pair with medication, dosage, frequency and "
        "indication as dictioary keys",
    )
    exposures: Optional[str] = Field(
        default="",
        description="Exposure to any infectious agents, toxins or environmental factors "
        "that could be contributing to the patient's illness",
    )
    psychological_factors: str = Field(
        default="",
        description="Captures the patient's emotional well-being, mental health, "
        "and feelings about their illness.",
    )
    expectations: Optional[str | List] = Field(
        default="",
        description="The patient's expectations from the evaluation or treatment",
    )
    additional_info: List | str = Field(
        default=[],
        description="Additional information patient may want to add.",
    )

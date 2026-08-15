from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Literal, Optional
from .base import BaseSchema


class SystemsEnquiry(BaseSchema):
    respiratory_symptoms: Optional[List[str]] = Field(
        None,
        description="Patient has any respiratory symptoms? (e.g., cough, sputum, wheezing, shortness of breath)",
    )
    chest_issues: Optional[Literal["Yes", "No"]] = Field(
        None, description="Patient experience any chest pain or ankle swelling?"
    )
    appetite_weight_changes: Optional[Literal["Yes", "No"]] = Field(
        None, description="Any changes in appetite or weight?"
    )
    gastrointestinal_symptoms: Optional[List[str]] = Field(
        None,
        description="Any nausea, vomiting, changes in bowel habits, stool appearance, or bleeding?",
    )

    urinary_issues: Optional[str] = Field(
        None,
        description="How often do patient pass urine? Any pain, blood in urine, or back pain?",
    )
    sexual_health: Optional[str] = Field(
        None,
        description="Any sexual problems? (e.g., discharge, infections, difficulties with urination for men; vaginal discharge, menstrual irregularities, or menopause details for women)",
    )

    musculoskeletal_issues: Optional[str] = Field(
        None,
        description="Any weakness, stiffness, or pain in your arms, legs, joints, or spine?",
    )

    neurological_symptoms: Optional[str] = Field(
        None,
        description="Any headaches, blackouts, fits, dizziness, tinnitus, abnormal sensations (e.g., tingling), or changes in senses (hearing, smell, taste, vision)?",
    )
    psychological_symptoms: Optional[str] = Field(
        None,
        description="Any experience of depression, anxiety, or any incontinence of urine or stools?",
    )
    additional_info: Optional[str] = Field(
        None,
        description="Any other details you consider relevant and should be included in the history.",
    )

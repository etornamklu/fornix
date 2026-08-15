from langchain_core.pydantic_v1 import BaseModel, Field, validator, root_validator
from typing import Dict, List, Optional, Union

from .complaint import ChiefComplaintSchema
from .personal_information import PersonalInformation
from .previous_medical_history import PreviousMedicalHistorySchema
from .social_history import SocialHistory
from .systemic_enquiry import SystemsEnquiry
from .family import FamilyHistory
from .drugs_and_allergies import DrugHistoryAndAllergies
from .permission import PermissionDenied


class PatientHistory(BaseModel):
    personal_information: Union[PersonalInformation, PermissionDenied]
    chief_complaint: Optional[ChiefComplaintSchema] = None
    medical_history: Optional[PreviousMedicalHistorySchema] = None
    systemic_enquiry: Optional[SystemsEnquiry] = None
    drug_and_allergy: Optional[DrugHistoryAndAllergies] = None
    family_history: Optional[FamilyHistory] = None
    social_history: Optional[SocialHistory] = None

    @root_validator(pre=True)
    def validate_data(cls, values: Dict):
        if (gender := values.get("personal_information", {}).get("gender")) == "male":
            if values.get("previous_medical_history", {}).get(
                "obstetric_gynecological_history"
            ):
                values["previous_medical_history"][
                    "obstetric_gynecological_history"
                ] = None
        return values

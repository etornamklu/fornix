from typing import Literal

from pydantic import BaseModel

from src.core.DoctorDashboard.patient_data_schema import PatientData


class ClinicalCompletionRequestBody(BaseModel):
    summary: str
    most_likely_diagnosis: str
    key: Literal[
        "follow_up", "edu_info", "emerg", "msr", "lab", "non_pharm"
    ]

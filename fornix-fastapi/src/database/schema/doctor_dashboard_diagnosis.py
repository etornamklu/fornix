import typing
from typing import List, Optional

from pydantic import BaseModel, UUID4


class DiagnosisBase(BaseModel):
    summary: str
    differential_diagnosis: dict[str, str]
    alternative_diagnoses: List[dict[str, str | bool]]
    primary_index: Optional[int] = -1
    name: Optional[str]
    clinical_items: Optional[List[dict[str, List[str | dict[str, str]] | dict]]]


class DoctorDashboardDiagnosisCreate(DiagnosisBase):
    patient_id: Optional[UUID4] = None
    clinical_items: List[dict[str, List[str | dict[str, str]] | dict]] = []


class DoctorDashboardDiagnosisUpdate(BaseModel):
    summary: Optional[str] = None
    differential_diagnosis: Optional[dict[str, str]] = None
    alternative_diagnoses: Optional[List[dict[str, str | bool]]] = None
    clinical_items: Optional[List[dict[str, List[str | dict[str, str]] | dict]]] = None
    name: Optional[str] = None
    patient_id: Optional[UUID4] = None
    primary_index: Optional[int] = None

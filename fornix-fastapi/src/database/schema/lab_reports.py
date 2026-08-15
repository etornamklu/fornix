from enum import Enum
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


class ReportType(str, Enum):
    blood_test = "blood_test"
    urine_test = "urine_test"
    stool_test = "stool_test"
    biopsy = "biopsy"
    culture_and_sensitivity = "culture_and_sensitivity"

class ReportMetadata(BaseModel):
    patient_id: Optional[str] = None
    report_type: ReportType
    clinical_context: str | None = None

class OverallInterpretation(BaseModel):
    summary: Optional[str] = None  # ONE headline sentence
    explanation: Optional[str] = None  # 1–2 lines of reasoning

class DifferentialDiagnosis(BaseModel):
    diagnosis: Optional[str] = None  # e.g. “Iron-deficiency anemia”
    explanation: Optional[str] = None  # Brief rationale (≤2 lines)

class Flags(BaseModel):
    critical_values: Optional[List[str]] = Field(default_factory=list)
    abnormal_values: Optional[List[str]] = Field(default_factory=list)

class LabValue(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None  # use string to allow ranges, e.g., "3-5"
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    flag: Optional[Literal["low", "high", "critical", "normal"]] = None

class PanelSummary(BaseModel):
    analytes_detailed_summary: Optional[str] = Field(None, description="A detailed technical summary of all analytes in the panel in a narrative, prose-style summary format.")
    overall_interpretation: Optional[OverallInterpretation] = None
    differential_diagnoses: Optional[List[DifferentialDiagnosis]] = Field(default_factory=list)
    clinical_recommendations: Optional[List[str]] = Field(default_factory=list)
    urgency: Optional[Literal["Routine", "Review_Soon", "Urgent", "Critical"]] = None
    flags: Optional[Flags] = None

class GlobalSummary(BaseModel):
    most_important_findings: Optional[List[str]] = Field(default_factory=list)
    next_steps: Optional[List[str]] = Field(default_factory=list)
    urgency_overall: Optional[Literal["Routine", "Review_Soon", "Urgent", "Critical"]] = None

class GeneralLabReport(BaseModel):
    panel_summaries: Optional[List[PanelSummary]] = Field(default_factory=list)
    global_summary: Optional[GlobalSummary] = None


class ReportUpdate(BaseModel):
    name: str | None = None
    patient_id: str | None = None
    content: GeneralLabReport | None = None
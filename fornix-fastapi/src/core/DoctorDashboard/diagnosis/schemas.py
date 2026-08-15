from pydantic import BaseModel, Field
from typing import List


class SearchQuerySchema(BaseModel):
    """
    A schema for structuring the output of search queries
    """

    search_queries: List[str] = Field(
        ...,
        description="1-3 comprehensive related search queries for finding the differential diagnosis based on the patient summary, incorporating every detail provided in the summary.",
    )


class SummarySchema(BaseModel):
    """
    A schema for structuring the patient history summary
    """

    summary: str = Field(
        ...,
        description="A concise summary including age, gender, medical history, current condition, symptoms, lab data, medications, social history, physical exam findings, course, and imaging results, if present.",
    )


class DiagnosisAnalysis(BaseModel):
    """
    Schema representing the analysis of a possible diagnosis.
    """

    condition: str = Field(..., description="Name of the condition being analyzed")
    icd_code: str = Field(..., description="ICD 10 code of the diagnosis")
    possible: bool = Field(
        ...,
        description="Indicates whether this condition is possible based on the patient history",
    )
    explanation: str = Field(
        ..., description="Explanation of why this condition is possible or not possible"
    )


class DifferentialDiagnosis(BaseModel):
    """
    Schema representing the most likely diagnosis.
    """

    condition: str = Field(..., description="Name of the differential diagnosis")
    icd_code: str = Field(..., description="ICD 10 code of the diagnosis")
    reasoning: str = Field(
        ..., description="Detailed reasoning for why this is the differential diagnosis"
    )


class DiagnosticModel(BaseModel):
    """
    Schema representing the complete diagnostic model including analysis, differential diagnosis, and alternative diagnoses.
    """

    differential_diagnosis: DifferentialDiagnosis = Field(
        ...,
        description="Differential diagnosis along with reasoning, additional tests, treatment options and ICD 10 code of the diagnosis",
    )
    alternative_diagnoses: List[DiagnosisAnalysis] = Field(
        ..., description="Analysis of alternative diagnoses"
    )

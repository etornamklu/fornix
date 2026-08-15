from typing import List, Optional
from pydantic import BaseModel, Field


class Medication(BaseModel):
    """
    Represents a medication recommendation with its details.
    """

    drug_name: str = Field(..., description="Name of the medication")
    dose: str = Field(..., description="The precise dosing regimen, including strength, route of administration (e.g., oral, IV, topical), frequency, and any necessary titration adjustments.")
    rationale: str = Field(
        ..., description="A concise clinical justification for prescribing the medication, considering the patient's condition, guideline recommendations, and expected therapeutic benefit."
    )
    adverse_effects: Optional[List[str]] = Field(
        None, description="A list of common and severe side effects associated with the medication, including black-box warnings where applicable."
    )


class SurgicalIntervention(BaseModel):
    """
    Represents a recommended surgical or procedural intervention, 
    including its purpose and justification.
    """

    procedure: str = Field(
        ..., 
        description="The name and type of the surgical or interventional procedure (e.g., 'Debridement of ulcer', 'Coronary artery bypass grafting')."
    )
    rationale: str = Field(
        ..., 
        description="A clear explanation of why the procedure is recommended over medical management, supported by clinical indications, expected benefits, and relevant guidelines."
    )


class PsychologicalIntervention(BaseModel):
    """
    Represents psychological and behavioral interventions tailored 
    to support the patient’s mental and emotional well-being.
    """

    psychotherapy: List[str] = Field(
        ..., 
        description="List of evidence-based psychotherapy approaches suitable for the patient's condition (e.g., 'Cognitive Behavioral Therapy', 'Motivational Interviewing')."
    )
    behavioral_interventions: Optional[List[str]] = Field(
        None, 
        description="A list of recommended behavioral modifications or patient education strategies to improve adherence and self-management (e.g., 'Diabetes education', 'Sleep hygiene training')."
    )
    rationale: str = Field(
        ..., 
        description="Justification for the psychological or behavioral intervention, including expected benefits in treatment adherence, mental health support, or coping strategies."
    )

class ClinicalManagement(BaseModel):
    """
    Comprehensive model for medical recommendations based on patient diagnosis and conditions.
    This model covers medication, surgical, and psychological interventions, as well as
    integrated treatment plans and non-pharmacological recommendations.
    """
    initial_management: Optional[str] = Field(
        None, description="Initial management steps for the patient if applicable"
    )
    medications: Optional[List[Medication]] = Field(
        None, description="List of up to 5 recommended medications"
    )
    
    surgical_intervention: Optional[SurgicalIntervention] = Field(
        None, description="Recommended surgical intervention, if applicable"
    )
    
    psychological_intervention: Optional[PsychologicalIntervention] = Field(
        None, description="Recommended psychological interventions, if applicable"
    )

    additional_notes: Optional[str] = Field(
        None, description="Any additional important information or recommendations"
    )

class NonPharmacologicalIntervention(BaseModel):
    """
    Represents non-pharmacological interventions tailored to the patient's condition.
    These interventions focus on lifestyle modifications, behavioral strategies, 
    physical therapies, and supportive care.
    """
    
    procedural_physical_interventions: Optional[List[str]] = Field(
        None,
        description=(
            "Surgical procedures (if applicable), physical therapy protocols, manual therapies, "
            "exercise prescriptions, and rehabilitation techniques"
        )
    )
    
    supportive_device_based_therapies: Optional[List[str]] = Field(
        None,
        description=(
            "Wound care techniques, assistive devices, bracing or orthotic recommendations, "
            "advanced technologies (e.g., NPWT, TENS), thermal or electromagnetic treatments"
        )
    )
    
    behavioral_lifestyle_modifications: Optional[List[str]] = Field(
        None,
        description=(
            "Dietary and nutritional recommendations, sleep hygiene practices, stress management techniques, "
            "activity modifications, and environmental adaptations"
        )
    )
    
    psychosocial_support: Optional[List[str]] = Field(
        None,
        description=(
            "Cognitive behavioral therapy, support groups, educational interventions, mindfulness or meditation practices, "
            "and caregiver education"
        )
    )



    # class Config:
    #     schema_extra = {
    #         "example": {
    #             "medications": [
    #                 {
    #                     "drug_name": "Lisinopril",
    #                     "dose": "10 mg orally once daily",
    #                     "rationale": "For blood pressure control in hypertensive patients"
    #                 }
    #             ],
    #             "surgical_intervention": None,
    #             "psychological_intervention": {
    #                 "psychotherapy": ["Cognitive Behavioral Therapy"],
    #                 "behavioral_interventions": ["Stress management techniques"]
    #             },
    #             "integrated_treatment_plan": "Combine medication for hypertension with psychological interventions for stress management",
    #             "non_pharmacological_interventions": ["Regular exercise", "Low-sodium diet"],
    #             "potential_interactions": ["Avoid potassium supplements with Lisinopril"],
    #             "additional_notes": "Monitor renal function and serum potassium levels regularly"
    #         }
    #     }


class Diagnosis(BaseModel):
    """
    Represents a potential diagnosis with its probability.
    """

    condition: str = Field(..., description="Name of the potential diagnosis")
    probability: str = Field(
        ...,
        description="Qualitative probability (e.g., 'Most likely', 'Possible', 'Less likely')",
    )


class DiagnosticTest(BaseModel):
    """
    Represents a diagnostic test or procedure.
    """

    name: str = Field(..., description="Name of the diagnostic test or procedure")
    rationale: str = Field(
        ..., description="Brief explanation for recommending this test"
    )
    expected_findings: str = Field(
        ..., description="Findings that would support the most likely diagnosis"
    )
    critical_values: Optional[str] = Field(
        None, description="Any critical values or results requiring immediate action"
    )


class AdditionalTest(BaseModel):
    """
    Represents an additional diagnostic test that may be considered.
    """

    name: str = Field(..., description="Name of the additional test or procedure")
    when_to_order: str = Field(
        ...,
        description="Specific conditions or scenarios when this test should be ordered",
    )
    expected_findings: str = Field(
        ..., description="Expected findings and their significance"
    )


class ImagingStudy(BaseModel):
    """
    Represents a recommended imaging study.
    """

    type: str = Field(
        ..., description="Type of imaging (e.g., X-ray, CT, MRI, ultrasound)"
    )
    area_of_focus: str = Field(
        ..., description="Specific area or organ system to be imaged"
    )
    expected_findings: str = Field(
        ...,
        description="What the imaging might reveal and its contribution to diagnosis",
    )


class SpecialistConsultation(BaseModel):
    """
    Represents a recommended specialist consultation.
    """

    specialty: str = Field(..., description="Medical specialty of the consultant")
    rationale: str = Field(
        ..., description="Explanation of why this consultation would be beneficial"
    )


class LabTestRecommendation(BaseModel):
    """
    Comprehensive model for Lab Test recommendations based on patient symptoms and conditions.
    This model covers first-line and additional tests, imaging studies, specialist consultations, and potential diagnostic pitfalls.
    """

    first_line_tests: List[DiagnosticTest] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="List of 3-5 initial diagnostic tests or procedures",
    )
    additional_tests: List[AdditionalTest] = Field(
        ...,
        min_items=2,
        max_items=4,
        description="List of 2-4 additional tests that may be considered",
    )
    imaging_studies: Optional[List[ImagingStudy]] = Field(
        None, description="Recommended imaging studies, if applicable"
    )
    specialist_consultations: Optional[List[SpecialistConsultation]] = Field(
        None, description="Suggested specialist consultations, if necessary"
    )
    diagnostic_pitfalls: List[str] = Field(
        ...,
        description="Common misdiagnoses or diagnostic challenges associated with this presentation",
    )
    red_flags: List[str] = Field(
        ...,
        description="Warning signs that should prompt immediate action or reassessment",
    )


class FollowUpInstruction(BaseModel):
    """Detailed follow-up instruction for clinical care"""

    instruction_number: int = Field(
        ..., description="Sequential number of the instruction"
    )
    category: str = Field(
        ...,
        description="Category of follow-up (e.g., 'Imaging', 'Medication', 'Laboratory')",
    )
    action: str = Field(..., description="Specific clinical action to be taken")
    timeframe: str = Field(..., description="When this action should be performed")
    clinical_rationale: str = Field(
        ..., description="Evidence-based justification for this action"
    )
    success_criteria: Optional[dict] = Field(
        None, description="Criteria to evaluate successful completion"
    )


class ClinicalFollowUpPlan(BaseModel):
    """
    Comprehensive clinical follow-up plan based on expert analysis of patient case.
    Generated according to evidence-based guidelines and specialist-level care standards.
    """

    follow_up_instructions: List[FollowUpInstruction] = Field(
        ..., description="Sequential list of follow-up instructions"
    )


class PatientEducationPlan(BaseModel):
    """
    Comprehensive patient education plan with five key points based on clinical diagnosis.
    """

    education_points: List[str] = Field(
        ..., description="List of 5 key educational points for the patient"
    )


class EmergencyInstruction(BaseModel):
    """
    Represents a critical emergency response instruction for healthcare professionals.
    Each instruction should be a precise, clinically specific directive for emergency care.
    """

    instruction: List[str] = Field(
        ...,
        description="A list of specific, actionable emergency care instruction that begins with a clear clinical action or assessment",
    )


class AIPatientConvoSummary(BaseModel):
    """
    Represents a summary of the patient's history and symptoms from the conversation.
    """

    summary: str = Field(
        ...,
        description="summary of the patient's history and symptoms from the conversation. Ignore names, addresses, and other non-medical details.",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "summary": (
                    "A 45-year-old male with intermittent chest discomfort persisting for three days, primarily localized in the central chest area."
                    "The pain occasionally radiates to the neck and jaw, and is described as a dull ache rather than sharp."
                    "He reports slight dizziness and episodes of sweating, without nausea or vomiting."
                    "Pain seems unrelated to specific activities but worsens after large meals. "
                    "He has a history of hyperlipidemia, borderline obesity with a BMI of 30.1, and is a former smoker. No current medications."
                    "Initial EKG showed non-specific T wave abnormalities, and he is scheduled for a stress test and lipid panel."
                )
            }
        }

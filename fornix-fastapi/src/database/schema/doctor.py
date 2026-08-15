from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from src.core.DoctorDashboard.doctor_patient_conversation.report.output_schemas import PatientHistory


class ReportType(str, Enum):
    progress_note = "progress_note"
    operative_note = "operative_note"
    admission_note = "admission_note"
    discharge_summary = "discharge_summary"
    procedure_note = "procedure_note"
    referral_note = "referral_note"
    death_note = "death_note"
    physical_examination = "physical_examination"
    history_taking = "history_taking"




class RenameChatHistory(BaseModel):
    name: str


class VitalSigns(BaseModel):
    temperature: Optional[str] = Field(None)
    pulse: Optional[str] = Field(None)
    blood_pressure: Optional[str] = Field(None)
    respiratory_rate: Optional[str] = Field(None)
    oxygen_saturation: Optional[str] = Field(None)


class SystemicExam(BaseModel):
    cardiovascular: Optional[str] = Field(None)
    respiratory: Optional[str] = Field(None)
    abdomen: Optional[str] = Field(None)
    neurological: Optional[str] = Field(None)
    musculoskeletal: Optional[str] = Field(None)
    others: Optional[List[str]] = Field(None)


class InputOutput(BaseModel):
    oral_intake: Optional[str] = Field(None)
    IV_fluids: Optional[str] = Field(None)
    urine_output: Optional[str] = Field(None)
    drains_or_catheters: Optional[str] = Field(None)


class Diagnosis(BaseModel):
    primary_diagnosis: Optional[str] = Field(None)
    secondary_diagnoses: Optional[List[str]] = Field(None)


class ManagementPlan(BaseModel):
    medications: Optional[List[str]] = Field(None)
    fluids_and_nutrition: Optional[str] = Field(None)
    labs_or_investigations: Optional[List[str]] = Field(None)
    procedures: Optional[str] = Field(None)
    referrals: Optional[str] = Field(None)
    physiotherapy: Optional[str] = Field(None)
    discharge_plan: Optional[str] = Field(None)


class Signature(BaseModel):
    signed_by: Optional[str] = Field(None)
    role: Optional[str] = Field(None)
    date_signed: Optional[str] = Field(None)


class Subjective(BaseModel):
    complaints_today: Optional[str] = Field(None)
    functional_status: Optional[str] = Field(None)
    pain_score: Optional[str] = Field(None)
    patient_concerns: Optional[str] = Field(None)


class Objective(BaseModel):
    vital_signs: Optional[VitalSigns] = Field(None)
    systemic_exam: Optional[SystemicExam] = Field(None)
    input_output: Optional[InputOutput] = Field(None)
    general_exams: Optional[str] = Field(None)


class Assessment(BaseModel):
    diagnosis: Optional[Diagnosis] = Field(None)
    status_update: Optional[str] = Field(None)
    complications: Optional[str] = Field(None)
    interpretation_of_investigations: Optional[str] = Field(None)


class Plan(BaseModel):
    management_plan: Optional[ManagementPlan] = Field(None)
    instructions_for_nursing: Optional[str] = Field(None)
    next_review: Optional[str] = Field(None)


class ProgressNote(BaseModel):
    subjective: Optional[Subjective] = Field(None)
    objective: Optional[Objective] = Field(None)
    assessment: Optional[Assessment] = Field(None)
    plan: Optional[Plan] = Field(None)
    signature: Optional[Signature] = Field(None)


class PostOpInstructions(BaseModel):
    medications: Optional[List[str]] = Field(None)
    IV_fluids: Optional[str] = Field(None)
    NPO_status: Optional[str] = Field(None)
    vitals_monitoring: Optional[str] = Field(None)
    positioning_and_mobility: Optional[str] = Field(None)
    drain_monitoring: Optional[str] = Field(None)
    wound_care: Optional[str] = Field(None)


class OperativeNote(BaseModel):
    preoperative_diagnosis: Optional[str] = Field(None)
    postoperative_diagnosis: Optional[str] = Field(None)
    indication_for_surgery: Optional[str] = Field(None)
    procedure_performed: Optional[str] = Field(None)
    date_of_surgery: Optional[str] = Field(None)
    surgeon: Optional[str] = Field(None)
    assistant_surgeons: List[str] = Field(None)
    anesthetist: Optional[str] = Field(None)
    type_of_anesthesia: Optional[str] = Field(None)
    findings: Optional[list[str]] = Field(None)
    procedure_details: Optional[str] = Field(None)
    estimated_blood_loss: Optional[str] = Field(None)
    complications: Optional[str] = Field(None)
    specimens_taken: Optional[str] = Field(None)
    drains_inserted: Optional[str] = Field(None)
    closure_details: Optional[str] = Field(None)
    post_op_instructions: Optional[PostOpInstructions] = Field(None)
    plan: Optional[str] = Field(None)
    signature: Optional[Signature] = Field(None)


class SocialHistory(BaseModel):
    smoking: Optional[str] = Field(None)
    alcohol: Optional[str] = Field(None)
    occupation: Optional[str] = Field(None)
    lifestyle: Optional[str] = Field(None)


class SystemsReview(BaseModel):
    cardiovascular: Optional[str] = Field(None)
    respiratory: Optional[str] = Field(None)
    gastrointestinal: Optional[str] = Field(None)
    genitourinary: Optional[str] = Field(None)
    musculoskeletal: Optional[str] = Field(None)
    neurological: Optional[str] = Field(None)
    integumentary: Optional[str] = Field(None)

class HeadAndNeck(BaseModel):
    scalp: Optional[str] = Field(None)
    eyes: Optional[str] = Field(None)
    ears: Optional[str] = Field(None)
    nose: Optional[str] = Field(None)
    throat: Optional[str] = Field(None)

class Chest(BaseModel):
    inspection: Optional[str] = Field(None)
    palpation: Optional[str] = Field(None)
    percussion: Optional[str] = Field(None)
    auscultation: Optional[str] = Field(None)

class Cardiovascular(BaseModel):
    heart_sounds: Optional[str] = Field(None)
    pulses: Optional[str] = Field(None)
    capillary_refill: Optional[str] = Field(None)

class Neurological(BaseModel):
    mental_status: Optional[str] = Field(None)
    cranial_nerves: Optional[str] = Field(None)
    motor_function: Optional[str] = Field(None)
    sensory_function: Optional[str] = Field(None)
    reflexes: Optional[str] = Field(None)
    coordination_and_gait: Optional[str] = Field(None)

class PhysicalExamination(BaseModel):
    general_appearance: Optional[str] = Field(None)
    level_of_consciousness: Optional[str] = Field(None)
    vital_signs: Optional[VitalSigns] = Field(None)
    skin_and_hydration: Optional[str] = Field(None)
    head_and_neck: Optional[HeadAndNeck] = Field(None)
    lymph_nodes: Optional[str] = Field(None)
    chest_exam: Optional[Chest] = Field(None)
    cardiovascular_exam: Optional[Cardiovascular] = Field(None)
    abdominal_exam: Optional[Chest] = Field(None)
    genitourinary_exam: Optional[str] = Field(None)
    neurological_exam: Optional[str] = Field(None)
    musculoskeletal_exam: Optional[str] = Field(None)
    extremities: Optional[str] = Field(None)
    additional_findings: Optional[list[str]] = Field(None)

class PhysicalExaminationPlan(BaseModel):
    provisional_diagnosis: Optional[str] = Field(None, description="Provisional diagnosis based on the physical examination findings.")
    investigations_to_order: Optional[List[str]] = Field(None, description="List of investigations to be ordered based on the physical examination findings.")
    medications_to_start: Optional[List[str]] = Field(None, description="List of medications to be started based on the physical examination findings.")
    procedures_to_schedule: Optional[List[str]] = Field(None, description="List of procedures to be scheduled based on the physical examination findings.")
    referrals: Optional[str] = Field(None, description="Referrals to other specialists or departments based on the physical examination findings.")
    monitoring_instructions: Optional[str] = Field(None, description="Monitoring instructions based on the physical examination findings.")
    discharge_or_admission_decision: Optional[str] = Field(None)
    patient_education: Optional[str] = Field(None)


class PhysicalExaminationNote(PhysicalExamination):
    plan: Optional[PhysicalExaminationPlan] = Field(None, description="Plan based on the physical examination findings.")
    signature: Optional[Signature] = Field(None, description="Signature of the clinician performing the examination.")

class InitialManagementPlan(BaseModel):
    medications: Optional[List[str]] = Field(None)
    fluids: Optional[str] = Field(None)
    monitoring: Optional[str] = Field(None)
    referrals: Optional[str] = Field(None)
    nursing_care: Optional[str] = Field(None)


class AdmissionNote(BaseModel):
    date_of_admission: Optional[str] = Field(None)
    chief_complaint: Optional[str] = Field(None)
    history_of_presenting_illness: Optional[str] = Field(None)
    past_medical_history: Optional[str] = Field(None)
    past_surgical_history: Optional[str] = Field(None)
    drug_history: Optional[str] = Field(None)
    allergy_history: Optional[str] = Field(None)
    family_history: Optional[str] = Field(None)
    social_history: Optional[SocialHistory] = Field(None)
    systems_review: Optional[SystemsReview] = Field(None)
    physical_examination: Optional[PhysicalExamination] = Field(None)
    provisional_diagnosis: Optional[str] = Field(None)
    differential_diagnoses: Optional[List[str]] = Field(None)
    investigations_ordered: Optional[List[str]] = Field(None)
    initial_management_plan: Optional[InitialManagementPlan] = Field(None)
    plan_for_next_review: Optional[str]
    signature: Optional[Signature] = Field(None, description="")


class InvestigationsAndResults(BaseModel):
    labs: Optional[List[str]] = Field(None, description="")
    imaging: Optional[List[str]] = Field(None, description="")
    others: Optional[List[str]] = Field(None, description="")


class FollowUpPlan(BaseModel):
    clinic_review_date: Optional[str] = Field(None, description="")
    department: Optional[str] = Field(None, description="")
    investigations_to_bring: Optional[List[str]] = Field(None, description="")
    wound_review_or_suture_removal: Optional[str] = Field(None, description="")


class DischargeSummary(BaseModel):
    date_of_admission: Optional[str] = Field(None, description="")
    date_of_discharge: Optional[str] = Field(None, description="")
    admitting_unit: Optional[str] = Field(None, description="")
    consultant: Optional[str] = Field(None, description="")
    reason_for_admission: Optional[str] = Field(None, description="")
    summary_of_clinical_course: Optional[str] = Field(None, description="")
    final_diagnosis: Optional[str] = Field(None, description="")
    procedures_done: Optional[List[str]] = Field(None, description="")
    investigations_and_results: Optional[InvestigationsAndResults] = Field(None, description="")
    treatments_given: Optional[List[str]] = Field(None, description="")
    condition_at_discharge: Optional[str] = Field(None, description="")
    discharge_medications: Optional[List[str]] = Field(None, description="")
    follow_up_plan: Optional[FollowUpPlan]  = Field(None, description="")
    patient_education_and_counseling: Optional[str] = Field(None, description="")
    remarks_or_additional_notes: Optional[str] = Field(None, description="")
    signature: Optional[Signature] = Field(None, description="")


class InstructionsAndFollowUp(BaseModel):
    immediate_care: Optional[str] = Field(None, description="")
    patient_instructions: Optional[str] = Field(None, description="")
    review_plan: Optional[str] = Field(None, description="")


class ProcedureNote(BaseModel):
    procedure_name: Optional[str] = Field(None, description="")
    indication_for_procedure: Optional[str] = Field(None, description="")
    date_and_time: Optional[str] = Field(None, description="")
    location: Optional[str] = Field(None, description="")
    performed_by: Optional[str] = Field(None, description="")
    assisted_by: Optional[str] = Field(None, description="")
    patient_consent: Optional[str] = Field(None, description="")
    procedure_details: Optional[str] = Field(None, description="")
    findings: Optional[list[str]] = Field(None, description="")
    complications: Optional[str] = Field(None, description="")
    post_procedure_status: Optional[str] = Field(None, description="")
    instructions_and_follow_up: Optional[InstructionsAndFollowUp]  = Field(None, description="")
    signature: Optional[Signature] = Field(None, description="")


class ReferralNote(BaseModel):
    referring_facility: Optional[str] = Field(None, description="")
    referring_clinician: Optional[str] = Field(None, description="")
    date_of_referral: Optional[str] = Field(None, description="")
    patient_name: Optional[str] = Field(None, description="")
    age: Optional[str] = Field(None, description="")
    sex: Optional[str] = Field(None, description="")
    reason_for_referral: Optional[str] = Field(None, description="")
    brief_history: Optional[str] = Field(None, description="")
    clinical_findings: Optional[str] = Field(None, description="")
    investigations_done: Optional[List[str]]  = Field(None, description="")
    treatment_given: Optional[List[str]]  = Field(None, description="")
    specific_request_or_question: Optional[str] = Field(None, description="")
    summary_impression: Optional[str] = Field(None, description="")
    additional_notes: Optional[list[str]] = Field(None, description="")
    signature: Optional[Signature] = Field(None, description="")


class FindingsOnExamination(BaseModel):
    consciousness: Optional[str] = Field(None, description="")
    pupils: Optional[str] = Field(None, description="")
    heart_sounds: Optional[str] = Field(None, description="")
    breath_sounds: Optional[str] = Field(None, description="")
    pulses: Optional[str] = Field(None, description="")


class CauseOfDeath(BaseModel):
    immediate_cause: Optional[str] = Field(None, description="")
    underlying_cause: Optional[str] = Field(None, description="")
    contributing_factors: Optional[str] = Field(None, description="")


class PlanPostDeath(BaseModel):
    family_informed: Optional[str] = Field(None, description="")
    body_identification_tagged: Optional[str] = Field(None, description="")
    mortuary_transfer: Optional[str] = Field(None, description="")
    certificate_of_cause_of_death: Optional[str] = Field(None, description="")


class DeathNote(BaseModel):
    date_and_time_of_death: Optional[str] = Field(None, description="")
    location_of_death: Optional[str] = Field(None, description="")
    name_of_deceased: Optional[str] = Field(None, description="")
    age: Optional[str] = Field(None, description="")
    sex: Optional[str] = Field(None, description="")
    referring_unit_or_team: Optional[str] = Field(None, description="")
    brief_history_or_reason_for_admission: Optional[str] = Field(None, description="")
    events_leading_to_death: Optional[str] = Field(None, description="")
    findings_on_examination: Optional[FindingsOnExamination] = Field(None, description="")
    confirmation_of_death: Optional[str] = Field(None, description="")
    cause_of_death: Optional[CauseOfDeath] = Field(None, description="")
    plan_post_death: Optional[PlanPostDeath] = Field(None, description="")
    additional_notes: Optional[str] = Field(None, description="")
    signature: Optional[Signature] = Field(None, description="")

class MedicalNotes(PatientHistory):
    pass


class TranscriptionAndMedicalNotes(BaseModel):
    transcript: Optional[str]
    medical_notes: Optional[MedicalNotes]

class ReportUpdate(BaseModel):
    name: str | None = None
    patient_id: str | None = None
    content: (
        ProcedureNote
        | OperativeNote
        | ProgressNote
        | AdmissionNote
        | DeathNote
        | ReferralNote
        | DischargeSummary
        | PhysicalExaminationNote
        | TranscriptionAndMedicalNotes
        | None
    ) = None



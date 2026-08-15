from pydantic import BaseModel, Field, validator, model_validator
from datetime import date
from enum import Enum
from typing import Optional, Literal, Dict, List


class BaseSchema(BaseModel):
    pass

    @model_validator(mode="before")
    def validate_fields(cls, values: Dict) -> Dict:
        for key, value in values.items():
            if not value and not isinstance(value, bool):
                values[key] = None
            elif isinstance(value, dict):
                value = {k: v for k, v in value.items() if v or isinstance(v, bool)}
                if value:
                    values[key] = value
                else:
                    values[key] = None

        return values


class Message(BaseModel):
    """
    A single message in a conversation between a patient and a doctor.
    """

    text: str = Field(..., description="The cleaned and corrected text of the message.")
    speaker: Literal["doctor", "patient"] = Field(
        ...,
        description="Either 'Patient' or 'Doctor', indicating who said the message.",
    )


class Transcript(BaseModel):
    """
    A structured representation of a conversation transcript between a patient and a doctor.

    The transcript is organized into individual messages, with each message labeled as being
    spoken by either the patient or the doctor. The messages are cleaned and corrected for
    spelling mistakes or incomplete sentences.
    """

    messages: List[Message] = Field(
        ...,
        description="A list of individual messages in the conversation, in the order they were spoken.",
    )


# class Gender(str, Enum):
#     MALE = "Male"
#     FEMALE = "Female"
#     NOT_SAY = "Rather not say"


# class PersonalInformation(BaseSchema):
#     name: str = Field(..., description="Full name of the individual.")
#     nickname: Optional[str] = Field(None, description="Nickname or preferred name.")
#     gender: Gender = Field(
#         ..., description="Gender of the patient. Don't ask if not you can infer it."
#     )
#     address: Optional[str] = Field(None, description="Residential address.")
#     date_of_birth: Optional[date] = Field(None, description="Date of birth")
#     date_of_admission: Optional[date] = Field(None, description="Date of admission")


# class ExerbatingAndRelievingFactors(BaseModel):
#     exacerbating_factors: List[str] = Field(
#         ..., description="Factors that worsen the pain"
#     )
#     relieving_factors: List[str] = Field(
#         ..., description="Factors that relieve the pain"
#     )


# class HPC(BaseSchema):
#     site: str = Field(..., description="Site of the pain", min_length=1)
#     onset: Optional[str] = Field(
#         None, description="When the pain started", min_length=1
#     )
#     character: Optional[str] = Field(
#         None, description="Characteristics of the pain", min_length=1
#     )
#     radiation: Optional[str] = Field(
#         None, description="Whether the pain radiates to other areas", min_length=1
#     )
#     association: Optional[str] = Field(
#         None, description="Any associated symptoms", min_length=1
#     )
#     timing: Optional[str] = Field(None, description="Timing of the pain", min_length=1)
#     exerbating_and_relieving_factors: Optional[ExerbatingAndRelievingFactors] = Field(
#         None, description="Factors that worsen and relieve the pain"
#     )
#     severity: float = Field(
#         None, description="Severity of the pain (e.g., scale of 0-10)"
#     )


# class ChiefComplaintSchema(BaseSchema):
#     presenting_complaints: List[str] | str = Field(
#         ..., description="Chief complaint(s) of the patient", min_length=1
#     )
#     hpc: HPC = Field(..., description="History of Presenting Complaint(s)")
#     additional_info: Optional[str] = Field(
#         None,
#         description="Any other details you consider relevant and should be included in the history.",
#     )


# class General(BaseModel):
#     previous_illnesses: Optional[List[str]] = Field(
#         ..., description="Details of previous illnesses"
#     )

#     @validator("previous_illnesses", pre=True)
#     def validate_previous_illnesses(cls, v):
#         return [v] if isinstance(v, str) else v


# class MedicalHistory(BaseModel):
#     critical_conditions: List[str] = Field(
#         ...,
#         description="List of medical conditions the patient has such as tb, hp, rf, epilepsy, asthma, diabetes_and_depression, anxiety_and_arthritis, cancer",
#     )
#     details: Optional[str] = Field(
#         None, description="Details about each condition, keyed by condition name"
#     )


# class Surgical(BaseModel):
#     surgeries: Optional[List[str]] = Field(
#         ..., description="List of surgeries the patient has had"
#     )

#     @validator("surgeries", pre=True)
#     def validate_surgeries(cls, v):
#         return [v] if isinstance(v, str) else v


# class ObstetricGynecologicalHistory(BaseModel):
#     menarche: Optional[str] = Field(None, description="Age at menarche")
#     menopause: Optional[str] = Field(None, description="Age at menopause")
#     menstrual_cycle: Optional[str] = Field(
#         None, description="Details of menstrual cycle"
#     )
#     pregnancies: int = Field(default=0, description="Details of pregnancies")
#     abortions: int = Field(default=0, description="Details of abortions")
#     deliveries: int = Field(default=0, description="Details of deliveries")
#     contraception: Optional[str] = Field(None, description="Details of contraception")
#     std: Optional[str] = Field(
#         default=None, description="Details of sexually transmitted diseases"
#     )
#     pelvic_pain: Optional[str] = Field(None, description="Details of pelvic pain")
#     vaginal_discharge: Optional[str] = Field(
#         None, description="Details of vaginal discharge"
#     )
#     bleeding: Optional[str] = Field(None, description="Details of abnormal bleeding")


# class PreviousMedicalHistorySchema(BaseSchema):
#     """
#     A structured representation of a patient's previous medical history.
#     """

#     general: Optional[General] = Field(None, description="General medical history")
#     medical: Optional[MedicalHistory] = Field(None, description="Medical history")
#     surgical: Optional[Surgical] = Field(None, description="Surgical history")
#     obstetric_gynecological: Optional[ObstetricGynecologicalHistory] = Field(
#         default=None,
#         description="Obstetric and gynecological history. Ignore if patient is a male",
#     )
#     additional_info: Optional[str] = Field(
#         None,
#         description="Any other details you consider relevant and should be included in the history.",
#     )

#     @validator("obstetric_gynecological", pre=True)
#     def validate_obstetric_gynecological(cls, v):
#         if not v:
#             return None
#         return v


# class SystemsEnquiry(BaseSchema):
#     respiratory_symptoms: Optional[List[str]] = Field(
#         None,
#         description="Do you have any respiratory symptoms? (e.g., cough, sputum, wheezing, shortness of breath)",
#     )
#     chest_issues: Optional[Literal["Yes", "No"]] = Field(
#         None, description="Do you experience any chest pain or ankle swelling?"
#     )
#     appetite_weight_changes: Optional[Literal["Yes", "No"]] = Field(
#         None, description="Any changes in appetite or weight?"
#     )
#     gastrointestinal_symptoms: Optional[List[str]] = Field(
#         None,
#         description="Any nausea, vomiting, changes in bowel habits, stool appearance, or bleeding?",
#     )

#     urinary_issues: Optional[str] = Field(
#         None,
#         description="How often do you pass urine? Any pain, blood in urine, or back pain?",
#     )
#     sexual_health: Optional[str] = Field(
#         None,
#         description="Any sexual problems? (e.g., discharge, infections, difficulties with urination for men; vaginal discharge, menstrual irregularities, or menopause details for women)",
#     )

#     musculoskeletal_issues: Optional[str] = Field(
#         None,
#         description="Any weakness, stiffness, or pain in your arms, legs, joints, or spine?",
#     )

#     neurological_symptoms: Optional[str] = Field(
#         None,
#         description="Any headaches, blackouts, fits, dizziness, tinnitus, abnormal sensations (e.g., tingling), or changes in senses (hearing, smell, taste, vision)?",
#     )
#     psychological_symptoms: Optional[str] = Field(
#         None,
#         description="Do you experience depression, anxiety, or any incontinence of urine or stools?",
#     )


# class Medicine(BaseModel):
#     name: str = Field(
#         ...,
#         description="Name of the drug, homoeopathic remedy, herbal medicine, or health food.",
#     )
#     dose: Optional[str] = Field(
#         None, description="Dose and frequency if patient is taking a drug."
#     )


# class Therapy(BaseModel):
#     type: str = Field(..., description="Type of therapy")
#     description: Optional[str] = Field(None, description="Details of the therapy")


# class Allergy(BaseModel):
#     allergen: str = Field(..., description="Allergen causing the reaction")
#     reaction: Optional[str] = Field(None, description="Reaction to the allergen")


# class UpsetMedicine(BaseModel):
#     name: str = Field(..., description="Name of the problematic medicine.")
#     reaction: Optional[str] = Field(None, description="Reaction to the medicine.")


# class DrugHistoryAndAllergies(BaseSchema):
#     medicines: Optional[List[Medicine]] = Field(
#         None, description="List of drugs, herbal, or homoeopathic remedies."
#     )
#     therapies: Optional[List[Therapy]] = Field(
#         None, description="List of therapies the patient is undergoing."
#     )
#     allergies: Optional[List[Allergy]] = Field(
#         None, description="List of allergies and reactions."
#     )
#     upset_medicines: Optional[List[UpsetMedicine]] = Field(
#         None, description="List of medicines causing adverse effects."
#     )


# class FamilyMember(BaseModel):
#     relation: str = Field(
#         ..., description="Relation to the patient (e.g., father, mother, brother)."
#     )
#     alive: Optional[bool] = Field(None, description="Is the family member alive?")
#     age: Optional[int] = Field(None, description="Current age or age at death.")
#     cause_of_death: Optional[str] = Field(
#         None, description="Cause of death if deceased."
#     )
#     current_illnesses: Optional[List[str]] = Field(
#         None, description="List of current illnesses."
#     )


# class FamilyHistory(BaseSchema):
#     family_members: Optional[List[FamilyMember]] = Field(
#         ..., description="Details of immediate family members."
#     )
#     hereditary_conditions: Optional[List[str]] = Field(
#         None, description="Illnesses that run in the family."
#     )


# class MaritalStatus(str, Enum):
#     SINGLE = "Single"
#     MARRIED = "Married"
#     DIVORCED = "Divorced"
#     SEPARATED = "Separated"
#     WIDOWED = "Widowed"
#     NOT_SAY = "Rather not say"


# class SmokingHistory(BaseSchema):
#     currently_smokes: Optional[bool] = Field(
#         None, description="Does the patient currently smoke?"
#     )
#     amount_per_day_week: Optional[str] = Field(
#         None, description="Amount smoked per day or week (if applicable)."
#     )
#     previously_smoked: Optional[bool] = Field(
#         None, description="Has the patient smoked in the past?"
#     )
#     quit_reason: Optional[str] = Field(None, description="Reason for quitting smoking.")


# class AlcoholHistory(BaseModel):
#     drinks_alcohol: Optional[bool] = Field(
#         None, description="Does the patient drink alcohol?"
#     )
#     units_per_day_week: Optional[str] = Field(
#         None, description="Alcohol consumption in units per day or week."
#     )


# class TravelHistory(BaseModel):
#     has_traveled_abroad: bool = Field(
#         ..., description="Has the patient traveled abroad?"
#     )
#     locations: Optional[List[str]] = Field(
#         None, description="Countries or regions visited."
#     )


# class MobilityInfo(BaseModel):
#     has_mobility_issues: bool = Field(
#         ..., description="Does the patient have mobility issues?"
#     )
#     home_description: Optional[str] = Field(
#         None,
#         description="Description of the home layout, including stairs and facilities.",
#     )


# class SocialHistory(BaseSchema):
#     marital_status: MaritalStatus = Field(
#         ..., description="Marital status (e.g., single, married, widowed, divorced)."
#     )
#     partner_health: Optional[str] = Field(
#         None, description="Health status of the partner (if applicable)."
#     )
#     number_of_children: Optional[int] = Field(None, description="Number of children.")
#     children_health: Optional[str] = Field(
#         None, description="Health status of the children."
#     )
#     occupation: str = Field(..., description="Occupation of the patient.")
#     financial_worries: Optional[Literal["Yes", "No"] | str] = Field(
#         None, description="Does the patient have financial worries?"
#     )
#     smoking_history: Optional[SmokingHistory] = Field(
#         None, description="Smoking history details."
#     )
#     alcohol_history: Optional[AlcoholHistory] = Field(
#         None, description="Alcohol consumption details."
#     )
#     travel_history: Optional[TravelHistory] = Field(
#         None, description="Details of travel abroad."
#     )
#     pets: Optional[List[str]] = Field(None, description="List of pets.")


# class PatientHistory(BaseModel):
#     """
#     Structured output containing all relevant information from the patient's transcript.
#     """

#     personal_details: PersonalInformation = Field(
#         ..., description="Personal information of the patient."
#     )
#     chief_complaint: ChiefComplaintSchema = Field(
#         ..., description="Chief complaint of the patient."
#     )
#     medical_history: PreviousMedicalHistorySchema = Field(
#         ..., description="Previous medical history of the patient."
#     )
#     systemic_enquiry: SystemsEnquiry = Field(
#         ..., description="Systemic enquiry of the patient."
#     )
#     drug_and_allergy: Optional[DrugHistoryAndAllergies] = Field(
#         None, description="Drug history and allergies of the patient."
#     )
#     family_history: Optional[FamilyHistory] = Field(
#         None, description="Family history of the patient."
#     )
#     social_history: Optional[SocialHistory] = Field(
#         None, description="Social history of the patient."
#     )
#     other_info: Optional[str] = Field(
#         None,
#         description="Any other details you consider relevant and should be included in the history.",
#     )


class Demographics(BaseModel):
    """Patient demographic information including basic personal details."""

    name: str | None = Field(None, description="Patient's full name")
    age: int | None = Field(None, description="Patient's age in years")
    occupation: str | None = Field(
        None, description="Patient's current occupation or employment status"
    )
    gender: str | None = Field(None, description="Patient's gender identification")
    residence: str | None = Field(
        None, description="Patient's current place of residence"
    )


class PatientHistory(BaseModel):
    """
    Comprehensive patient medical history report.
    This model structures patient information with demographic details followed by
    narrative sections describing the patient's medical situation.
    """

    demographics: Demographics | None = Field(
        None, description="Basic patient demographic information in a structured format"
    )

    chief_complaint: str = Field(
        description="A concise statement describing the primary reason for the patient's visit or main symptom. "
        "Should include the primary symptom and its duration, written in a clear, direct manner."
    )

    history_of_present_illness: str = Field(
        description="A detailed narrative of the current medical issue, including: "
        "- When and how symptoms began "
        "- Detailed description of symptoms (quality, location, severity) "
        "- Radiation or spread of symptoms "
        "- Associated symptoms "
        "- Factors that make it better or worse "
        "- Previous similar episodes "
        "- Impact on daily activities "
        "The narrative should flow naturally and provide a comprehensive picture of the patient's current condition."
    )

    review_of_systems: str | None = Field(
        None,
        description="A systematic narrative review of body systems, including but not limited to: "
        "cardiovascular, respiratory, gastrointestinal, neurological, musculoskeletal, skin, and endocrine systems. "
        "Each system should be described with relevant positive or negative findings that relate to the current situation.",
    )

    past_medical_history: str | None = Field(
        None,
        description="A narrative description of the patient's significant past medical conditions, "
        "including chronic conditions, their duration, treatments, and current status. "
        "Should include approximate dates of diagnosis and any significant complications or treatments.",
    )

    medication_history: str | None = Field(
        None,
        description="A comprehensive description of current medications, including: "
        "- Names of medications and their purposes "
        "- Any recent changes in medication "
        "- Medication adherence "
        "- Known allergies or adverse reactions "
        "Written in a flowing, narrative style rather than as a list.",
    )

    family_history: str | None = Field(
        None,
        description="A narrative of relevant family medical history, particularly focusing on conditions "
        "that may have genetic components or impact the current medical situation. "
        "Should include significant conditions in immediate family members.",
    )

    social_history: str | None = Field(
        None,
        description="A detailed narrative of the patient's lifestyle and social factors, including: "
        "- Occupation and work environment "
        "- Living situation "
        "- Exercise and activity level "
        "- Smoking, alcohol, and substance use "
        "- Diet and nutrition "
        "- Stress factors and coping mechanisms "
        "Written as a cohesive narrative that provides insight into the patient's daily life and habits.",
    )

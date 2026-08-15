from enum import Enum
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


class ReportType(str, Enum):
    ecg = "ecg"
    xray = "xray"
    ultrasound = "ultrasound"
    ct_scan = "ct_scan"


class ReportMetadata(BaseModel):
    patient_id: Optional[str] = None
    report_type: ReportType
    clinical_context: str


class ECGMeasurement(BaseModel):
    heart_rate: Optional[str] = Field(
        None, description="Heart rate in beats per minute add the unit"
    )
    pr_interval: Optional[str] = Field(
        None, description="PR interval in milliseconds add the unit"
    )
    qrs_duration: Optional[str] = Field(
        None, description="QRS duration in milliseconds add the unit"
    )
    qt_interval: Optional[str] = Field(
        None, description="QT interval in milliseconds add the unit"
    )
    corrected_qt: Optional[str] = Field(
        None, description="Corrected QT interval (QTc) in milliseconds add the unit"
    )
    axis: Optional[str] = Field(
        None,
        description="Electrical axis (e.g., normal, left axis deviation) add the unit",
    )


class ECGFindings(BaseModel):
    rhythm: Optional[str] = Field(
        None,
        description="Description of rhythm (e.g., sinus rhythm, atrial fibrillation)",
    )
    positive_findings: Optional[List[str]] = Field(
        None, description="Key pathological abnormalities present on ECG"
    )
    negative_findings: Optional[List[str]] = Field(
        None, description="Important pathologies explicitly ruled out"
    )


class ECGReport(BaseModel):
    summary: Optional[str] = Field(
        None, description="High-level overview of ECG interpretation"
    )
    measurements: Optional[ECGMeasurement] = Field(
        None, description="Structured ECG interval and axis measurements"
    )
    findings: Optional[ECGFindings] = Field(
        None, description="Structured list of rhythm and abnormal findings"
    )
    detailed_findings: Optional[str] = Field(
        None,
        description="Technical specialist-level narrative of ECG interpretation with clinical reasoning",
    )
    diagnosis: Optional[str] = Field(
        None, description="Most likely diagnosis based on ECG"
    )
    clinical_correlation: Optional[str] = Field(
        None,
        description="Explanation of ECG findings in the context of the patient's history or presentation",
    )
    clinical_management: Optional[str] = Field(
        None,
        description="Next clinical step: e.g., referral, admission, further testing",
    )


class CTScanRegion(str, Enum):
    HEAD = "Head"
    CHEST = "Chest"
    ABDOMEN = "Abdomen"
    PELVIS = "Pelvis"
    SPINE = "Spine"
    WHOLE_BODY = "Whole Body"
    OTHER = "Other"


class CTAbnormality(BaseModel):
    region: Optional[str] = Field(
        None,
        description="Anatomical location (e.g., left temporal lobe, right upper lobe)",
    )
    finding: Optional[str] = Field(None, description="Description of the abnormality")
    significance: Optional[str] = Field(
        None,
        description="Clinical significance or concern (e.g., 'suspicious for malignancy')",
    )


class CTFindings(BaseModel):
    detailed_findings: Optional[str] = Field(
        None,
        description="Technical specialist-level narrative of CT image findings, including rationale and interpretation",
    )
    positive_findings: Optional[List[str]] = Field(
        None,
        description="List of clinically significant pathological findings noted in the scan",
    )
    negative_findings: Optional[List[str]] = Field(
        None,
        description="List of important conditions or abnormalities explicitly ruled out",
    )


class CTScanReport(BaseModel):
    """Detailed CT scan report with structured and narrative components"""

    scan_type: Optional[CTScanRegion] = Field(
        None, description="Anatomical region scanned"
    )
    abnormalities: Optional[List[CTAbnormality]] = Field(
        None,
        description="Structured list of abnormal findings with anatomical locations and clinical significance",
    )
    findings: Optional[CTFindings] = Field(
        None, description="Detailed and structured radiologist interpretation"
    )
    impression: Optional[str] = Field(
        None, description="Concise diagnostic interpretation or differential"
    )
    diagnosis: Optional[str] = Field(
        None, description="Most likely diagnosis based on CT findings"
    )
    clinical_correlation: Optional[str] = Field(
        None,
        description="Explanation of how CT findings relate to the patient's clinical scenario",
    )
    clinical_management: Optional[str] = Field(
        None,
        description="Recommended next steps (e.g., MRI, biopsy, specialist referral)",
    )


class XrayImageQuality(BaseModel):
    exposure: Optional[Literal["Adequate", "Under", "Over"]] = Field(None, description="")
    rotation: Optional[Literal["None", "Mild", "Severe"]] = Field(None, description="")
    inspiration: Optional[Literal["Adequate", "Poor", "Not_Applicable"]] = Field(None, description="")
    motion_artifact: Optional[bool] = Field(None, description="")



class Fractures(BaseModel):
    present: Optional[bool] = Field(None, description="")
    location: Optional[str] = Field(None, description="")
    type: Optional[str] = Field(None, description="")
    displacement: Optional[Literal["None", "Mild", "Severe"]] = Field(None, description="")
    associated_findings: Optional[List[str]] = Field(None, description="")


class Lesions(BaseModel):
    present: Optional[bool] = Field(None, description="")
    description: Optional[str] = Field(None, description="")


class HardwareOrProstheses(BaseModel):
    present: Optional[bool] = Field(None, description="")
    type: Optional[str] = Field(None, description="")
    position: Optional[Literal["Normal", "Malpositioned"]] = Field(None, description="")


class SkeletalFindings(BaseModel):
    alignment: Optional[Literal["Normal", "Malalignment", "Subluxation", "Dislocation"]] = Field(None, description="")
    fractures: Optional[Fractures] = Field(None, description="")
    bone_density: Optional[Literal["Normal", "Osteopenia", "Osteoporosis", "Sclerotic"]] = Field(None, description="")
    lesions: Optional[Lesions] = Field(None, description="")
    degenerative_changes: Optional[Literal["Absent", "Mild", "Moderate", "Severe"]] = Field(None, description="")
    hardware_or_prostheses: Optional[HardwareOrProstheses] = Field(None, description="")


class Masses(BaseModel):
    present: Optional[bool] = Field(None, description="")
    description: Optional[str] = Field(None, description="")


class SoftTissues(BaseModel):
    swelling: Optional[bool] = Field(None, description="")
    foreign_bodies: Optional[bool] = Field(None, description="")
    calcifications: Optional[bool] = Field(None, description="")
    gas_collections: Optional[bool] = Field(None, description="")
    masses: Optional[Masses] = Field(None, description="")


class JointSpaces(BaseModel):
    normal: Optional[bool] = Field(None, description="")
    narrowing: Optional[bool] = Field(None, description="")
    effusion: Optional[bool] = Field(None, description="")
    erosion: Optional[bool] = Field(None, description="")
    subluxation_or_dislocation: Optional[bool] = Field(None, description="")


class ChestOrgans(BaseModel):
    lung_fields: Optional[str] = Field(None, description="")
    pleura: Optional[str] = Field(None, description="")
    heart: Optional[str] = Field(None, description="")
    mediastinum: Optional[str] = Field(None, description="")
    diaphragm: Optional[str] = Field(None, description="")


class AbdomenOrgans(BaseModel):
    bowel_gas_pattern: Optional[str] = Field(None, description="")
    organomegaly: Optional[str] = Field(None, description="")
    calcification: Optional[str] = Field(None, description="")
    free_air: Optional[bool] = Field(None, description="")


class SpineOrgans(BaseModel):
    curvature: Optional[Literal["Normal", "Scoliosis", "Kyphosis", "Lordosis"]] = Field(None, description="")
    vertebral_alignment: Optional[Literal["Normal", "Abnormal"]] = Field(None, description="")
    disc_spaces: Optional[Literal["Normal", "Narrowed"]] = Field(None, description="")
    vertebral_fractures: Optional[bool] = Field(None, description="")
    degenerative_changes: Optional[bool] = Field(None, description="")


class SkullOrgans(BaseModel):
    vault: Optional[str] = Field(None, description="")
    base: Optional[str] = Field(None, description="")
    sinuses: Optional[str] = Field(None, description="")
    orbits: Optional[str] =  Field(None, description="")
    mandible: Optional[str] = Field(None, description="")


class OrganSpecific(BaseModel):
    chest: Optional[ChestOrgans] = Field(None, description="")
    abdomen: Optional[AbdomenOrgans] = Field(None, description="")
    spine: Optional[SpineOrgans] = Field(None, description="")
    skull: Optional[SkullOrgans] = Field(None, description="")


class Findings(BaseModel):
    skeletal: Optional[SkeletalFindings] = Field(None, description="")
    soft_tissues: Optional[SoftTissues] = Field(None, description="")
    joint_spaces: Optional[JointSpaces] = Field(None, description="")
    organ_specific: Optional[OrganSpecific] = Field(None, description="")


class Impression(BaseModel):
    detailed_summary: Optional[str] = Field(
        None,
        description="Specialist-level narrative describing the radiographic findings in technical detail",
    )
    differential_diagnosis: Optional[List[str]] = Field(None, description="")
    urgency: Optional[Literal["Routine", "Urgent", "Emergency"]] = Field(None, description="")


class XRayReport(BaseModel):
    anatomic_region: Optional[Literal["Chest", "Abdomen", "Pelvis", "Spine", "Upper_Limb","Lower_Limb", "Skull", "Others"]] = Field(None, description="")
    image_quality: Optional[XrayImageQuality] = Field(None, description="")
    projection: Optional[Literal["AP", "PA", "Lateral", "Oblique", "Special_View"]] = Field(None, description="")
    position: Optional[Literal["Erect", "Supine", "Decubitus", "Unknown"]] = Field(None, description="")
    findings: Optional[Findings] = Field(None, description="")
    impression: Optional[Impression] = Field(None, description="")


class UltrasoundModality(str, Enum):
    TRANSABDOMINAL = "Transabdominal"
    TRANSDUCTAL = "Transductal"
    TRANSLABIAL = "Translabial"
    TRANSVAGINAL = "Transvaginal"
    TRANSRECTAL = "Transrectal"
    TRADITIONAL = "Traditional"
    DOPPLER = "Doppler"
    OTHER = "Other"


class UltrasoundImageQuality(BaseModel):
    resolution: Optional[Literal["Good", "Moderate", "Poor"]] = Field(None, description="Overall resolution of the image")
    artifact_presence: Optional[bool] = Field(None, description="Whether artifacts are present that may hinder interpretation")
    patient_cooperation: Optional[Literal["Good", "Limited", "Uncooperative"]] = Field(None, description="Degree of patient cooperation during scan")
    adequacy_for_interpretation: Optional[Literal["Adequate", "Inadequate"]] = Field(None, description="Was the scan adequate for full interpretation?")


class UltrasoundOrganFinding(BaseModel):
    organ: Optional[str] = Field(None, description="Organ or structure evaluated (e.g., liver, uterus, kidney)")
    description: Optional[str] = Field(None, description="Detailed description of any abnormal findings in the organ")
    measurements: Optional[List[str]] = Field(None, description="Key measurements (e.g., size of lesion, thickness of endometrium)")
    vascularity: Optional[str] = Field(None, description="Presence and pattern of blood flow (e.g., hypervascular, avascular)")
    echogenicity: Optional[str] = Field(None, description="Echogenicity pattern (e.g., hypoechoic, heterogeneous)")


class UltrasoundFindings(BaseModel):
    positive_findings: Optional[List[UltrasoundOrganFinding]] = Field(
        None, description="Structured list of abnormal or noteworthy organ findings"
    )
    negative_findings: Optional[List[str]] = Field(
        None, description="Important abnormalities or diseases explicitly ruled out"
    )
    free_fluid: Optional[str] = Field(None, description="Presence or absence of free fluid in abdominal/pelvic cavity")
    masses: Optional[str] = Field(None, description="Description of any masses observed (if not listed under an organ)")
    other_findings: Optional[str] = Field(None, description="Other relevant sonographic findings not captured above")


class UltrasoundImpression(BaseModel):
    detailed_summary: Optional[str] = Field(
        None,
        description="Specialist-level narrative describing the sonographic findings in technical detail",
    )
    diagnosis: Optional[str] = Field(None, description="Most likely diagnosis or differential based on findings")
    recommendations: Optional[str] = Field(None, description="Next steps (e.g., follow-up scan, biopsy, referral)")


class UltrasoundReport(BaseModel):
    anatomic_region: Optional[Literal[
        "Abdomen", "Pelvis", "Cardiac", "Vascular", "Musculoskeletal", "Obstetric",
        "Gynecological", "Thyroid", "Testicular", "Renal", "Breast", "Soft_Tissue", "Other"
    ]] = Field(None, description="Primary anatomical region evaluated")
    modality: Optional[UltrasoundModality] = Field(None, description="Ultrasound modality or technique used")
    image_quality: Optional[UltrasoundImageQuality] = Field(None, description="Technical quality of the ultrasound study")
    findings: Optional[UltrasoundFindings] = Field(None, description="Structured and narrative description of ultrasound findings")
    impression: Optional[UltrasoundImpression] = Field(None, description="Interpretation and clinical context for the ultrasound report")



class ReportUpdate(BaseModel):
    name: str | None = None
    patient_id: str | None = None
    content: ECGReport | XRayReport | CTScanReport | UltrasoundReport | None = None

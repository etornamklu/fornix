import { HTMLProps } from "react"
import { getBearerToken } from "@/utils/auth.server"
import { BACKEND_BASE_URL } from "@/utils/constants"

export enum LogoVariants {
    primary = "primary",
    plain = "plain",
    dark = "dark",
    light = "light"
}

export enum ProfileSetupSteps {
    StepOne = "StepOne",
    StepTwo = "StepTwo"
}

type ButtonSize = "sm" | "md" | "lg" | "xl"

type ButtonVariant = "primary" | "secondary" | "destructive" | "outline" | "link" | "ghost" | "plain"

export interface ButtonProps {
    variant?: ButtonVariant
    size?: ButtonSize
    label?: string
    type?: "button" | "submit" | "reset"
    children?: React.ReactNode
    className?: string
    disabled?: boolean
    onClick?: () => void
}

export enum AccountType {
    patient = "User/Client",
    doctor = "Clinician",
    pharmacy = "Pharmacy",
    hospital = "Clinic/Hospital",
    radiologist = "Radiology",
    admin = "Admin"
}

export interface ProfileSetupCardProps extends HTMLProps<HTMLDivElement> {
    accountType: AccountType
    selected: boolean
    onClick?: () => void
}

export enum SubscriptionType {
    creditPack0 = "Free Trial",
    creditPack1 = "Small Credit Pack",
    creditPack3 = "Promo Credit Pack",
    creditPack2 = "Standard Credit Pack"
}

export interface SubscriptionCardProps extends HTMLProps<HTMLDivElement> {
    type: SubscriptionType
    credits?: number
    benefits?: string[]
    className?: string
    showBadge?: boolean
    ctaText?: string
    currentPlan?: boolean
    onClick?: () => void
    sx?: string
    setShowFreeTrialModal?: (b: boolean) => void
    smallView?: boolean
}

export interface DiagnosisStreamProps {
    age: string
    sex: string
    complaint_and_duration: string
    symptoms_history: string
    med_history: string
    social_family_history: string
    clinical_studies: string
}

export interface DifferentialDiagnosis {
    condition: string
    reasoning: string
}

export interface AlternativeDiagnosis {
    condition: string
    possible: string | boolean
    explanation: string
}

export interface Diagnosis {
    differential_diagnosis: DifferentialDiagnosis
    alternative_diagnoses: AlternativeDiagnosis[]
}

export interface SummaryItem {
    key: string
    value: string
}

export interface DoctorsGptRequestProps {
    conversation_id: string
    content: string
    audioBlob?: Blob
}

export interface PatientsGptRequestProps {
    conversation_id: string
    content: string
}

export interface Tab {
    heading: string
    slug: string
    icon: JSX.Element
}

export type IEmergencyContact = {
    name: string
    number: string
    relationship: string
}

export interface PatientStaticData {
    fullname: string
    dob: string
    gender: string
    maritalStatus: string
    occupation: string
    occupationDesc: string
    address: string
    phone: string
    emergencyContacts: IEmergencyContact[]
    surgicalHistory: string
    allergies: string
    medications: string
    familyHistory: string
    lifeStyleHabits: string
    dietaryHabits: string
    exerciseRoutine: number
    psychosocialHistory: string
}

export interface IDataStep extends PatientStaticData {
    handleDataChange: (key: string, value: string | number | IEmergencyContact[]) => void
    setStep: React.Dispatch<React.SetStateAction<number>>
}

export interface INewEmergencyContact extends IEmergencyContact {
    index: number
    editEmergencyContact: (index: number, property: string, value: string) => void
}

export interface DoctorGptSourceLink {
    url: string
    description: string
}

export interface PatientsGptSourceLink {
    url: string
    description: string
}

export interface DoctorGptResponse {
    response: string
    source_links: DoctorGptSourceLink[]
    related_questions: string[]
}

export interface PatientsGptResponse {
    response: string
    source_links: PatientsGptSourceLink[]
}

export interface DoctorDashboardDiagnosis {
    id: string
    differential_diagnosis: DifferentialDiagnosis
    alternative_diagnoses: AlternativeDiagnosis[]
    primary_index: number
    clinical_items: any[]
    summary: string
    patient_id: string | null
    name: string
    doctor_id: string
}

export type AuthType = {
    name: string
    email: string
    id: string
    role: string
    credits: number
    free_trial: boolean
    profile_picture_url: string
    user_code: string
    organization_id?: string
}
export const authDefault: AuthType = {
    name: "Loading..",
    email: "",
    id: "00000000-0000-0000-0000-000000000000",
    role: "loading",
    credits: -1,
    free_trial: true,
    profile_picture_url: "",
    user_code: "",
    organization_id: undefined
}

export interface MsrMedication {
    drug_name: string
    dose: string
    rationale: string
    adverse_effects?: string[]
}

export interface SurgicalIntervention {
    procedure: string
    rationale: string
}

export interface PsychologicalIntervention {
    psychotherapy: string[]
    behavioral_interventions: string[]
    rationale: string
}

export interface MsrResponse {
    medications: MsrMedication[]
    additional_notes: string
    surgical_intervention: SurgicalIntervention
    psychological_intervention: PsychologicalIntervention
    initial_management: string
}

export interface LabFirstLineTest {
    name: string
    rationale: string
    expected_findings?: string
    critical_values?: string
}

export interface LabAdditionalTest {
    name: string
    when_to_order?: string
    expected_findings?: string
}

export interface LabImagingStudy {
    type: string
    area_of_focus?: string
    expected_findings?: string
}

export interface LabSpecialistConsultation {
    specialty: string
    rationale: string
}

export interface LabResponse {
    first_line_tests: LabFirstLineTest[]
    additional_tests?: LabAdditionalTest[]
    imaging_studies?: LabImagingStudy[]
    specialist_consultations?: LabSpecialistConsultation[]
    diagnostic_pitfalls?: string[]
    red_flags?: string[]
}

export interface NonPharmResponse {
    procedural_physical_interventions: string[]
    supportive_device_based_therapies: string[]
    behavioral_lifestyle_modifications: string[]
    psychosocial_support: string[]
}

export interface RenameChatSessionRequest {
    name: string
}

export interface RenameChatSessionResponse {
    session_id: string
    name: string
    type: string
    created_at: string
    updated_at: string
}

export enum DashboardPath {
    Base = "/",
    Diagnosis = "/diagnosis",
    ImportSummary = "/import",
    MedFind = "/medfind",
    PatientMedFind = "/patientmedfind",
    Settings = "/settings",
    Conversation = "/acc",
    Examination = "/physical_exam",
    // HistoryTaking = "/history-taking",
    ProgressNotes = "/progress-note",
    OperativeNotes = "/operative-note",
    AdmissionNotes = "/admission-note",
    DischargeSummary = "/discharge-summary",
    ProcedureNote = "/procedure-note",
    ReferralNotes = "/referral-note",
    HistoryTaking = "/history-taking",
    Questionnaire = "/questionnaire",
    HowItWorks = "/how-it-works",
    Condition = "/condition",
    QuestionaireHistory = "/questionaire-history",
    Radiology = "/radiology",
    LabTest = "/lab-test"
}

export interface Report {
    id: string
    doctor_id?: string
    patient_id?: string
    name: string
    type: ReportType
    audio_id: string
    content: Object
    created_at?: string
    updated_at?: string
}

export interface Signature {
    signed_by?: string
    role?: string
    date_signed?: string
}

export interface InstructionsAndFollowUp {
    immediate_care?: string
    patient_instructions?: string
    review_plan?: string
}

export interface ProcedureNoteReport {
    procedure_name?: string
    indication_for_procedure?: string
    date_and_time?: string
    location?: string
    performed_by?: string
    assisted_by?: string
    patient_consent?: string
    procedure_details?: string
    findings?: string[]
    complications?: string
    post_procedure_status?: string
    instructions_and_follow_up?: InstructionsAndFollowUp
    signature?: Signature
}

export enum ReportType {
    PhysicalExamination = "physical_examination",
    HistoryTaking = "history_taking",
    ReferralNote = "referral_note",
    DischargeSummary = "discharge_summary",
    ProgressNote = "progress_note",
    OperativeNote = "operative_note",
    AdmissionNote = "admission_note",
    ProcedureNote = "procedure_note",
    DeathNote = "death_note"
}

export enum RadiologyReportType {
    ECG = "ecg",
    XRay = "xray",
    Ultrasound = "ultrasound",
    CTScan = "ct_scan"
}

export interface RadiologyReport {
    id: string
    name: string
    created_at: string
    patient_id?: string
    report_type?: string
    patient_name?: string
    content?: Record<string, any>
}

export interface ReportMetadata {
    patient_id?: string
    report_type: ReportType
    clinical_context: string
}

// ECG Report Types
export interface ECGMeasurement {
    heart_rate?: string
    pr_interval?: string
    qrs_duration?: string
    qt_interval?: string
    corrected_qt?: string
    axis?: string
}

export interface ECGFindings {
    rhythm?: string
    positive_findings?: string[]
    negative_findings?: string[]
}

export interface ECGReport {
    summary?: string
    measurements?: ECGMeasurement
    findings?: ECGFindings
    detailed_findings?: string
    diagnosis?: string
    clinical_correlation?: string
    clinical_management?: string
}

// CT Scan Report Types
export enum CTScanRegion {
    HEAD = "Head",
    CHEST = "Chest",
    ABDOMEN = "Abdomen",
    PELVIS = "Pelvis",
    SPINE = "Spine",
    WHOLE_BODY = "Whole Body",
    OTHER = "Other"
}

export interface CTAbnormality {
    region?: string
    finding?: string
    significance?: string
}

export interface CTFindings {
    detailed_findings?: string
    positive_findings?: string[]
    negative_findings?: string[]
}

export interface CTScanReport {
    scan_type?: CTScanRegion
    abnormalities?: CTAbnormality[]
    findings?: CTFindings
    impression?: string
    diagnosis?: string
    clinical_correlation?: string
    clinical_management?: string
}

// X-Ray Report Types
export type ExposureLevel = "Adequate" | "Under" | "Over"
export type RotationLevel = "None" | "Mild" | "Severe"
export type InspirationLevel = "Adequate" | "Poor" | "Not_Applicable"
export type DisplacementLevel = "None" | "Mild" | "Severe"
export type AlignmentLevel = "Normal" | "Malalignment" | "Subluxation" | "Dislocation"
export type BoneDensityLevel = "Normal" | "Osteopenia" | "Osteoporosis" | "Sclerotic"
export type DegenerativeLevel = "Absent" | "Mild" | "Moderate" | "Severe"
export type HardwarePosition = "Normal" | "Malpositioned"
export type SpineCurvature = "Normal" | "Scoliosis" | "Kyphosis" | "Lordosis"
export type VertebralAlignment = "Normal" | "Abnormal"
export type DiscSpaces = "Normal" | "Narrowed"
export type AnatomicRegion = "Chest" | "Abdomen" | "Pelvis" | "Spine" | "Upper_Limb" | "Lower_Limb" | "Skull" | "Others"
export type Projection = "AP" | "PA" | "Lateral" | "Oblique" | "Special_View"
export type Position = "Erect" | "Supine" | "Decubitus" | "Unknown"
export type UrgencyLevel = "Routine" | "Urgent" | "Emergency"

export interface XrayImageQuality {
    exposure?: ExposureLevel
    rotation?: RotationLevel
    inspiration?: InspirationLevel
    motion_artifact?: boolean
}

export interface Fractures {
    present?: boolean
    location?: string
    type?: string
    displacement?: DisplacementLevel
    associated_findings?: string[]
}

export interface Lesions {
    present?: boolean
    description?: string
}

export interface HardwareOrProstheses {
    present?: boolean
    type?: string
    position?: HardwarePosition
}

export interface SkeletalFindings {
    alignment?: AlignmentLevel
    fractures?: Fractures
    bone_density?: BoneDensityLevel
    lesions?: Lesions
    degenerative_changes?: DegenerativeLevel
    hardware_or_prostheses?: HardwareOrProstheses
}

export interface Masses {
    present?: boolean
    description?: string
}

export interface SoftTissues {
    swelling?: boolean
    foreign_bodies?: boolean
    calcifications?: boolean
    gas_collections?: boolean
    masses?: Masses
}

export interface JointSpaces {
    normal?: boolean
    narrowing?: boolean
    effusion?: boolean
    erosion?: boolean
    subluxation_or_dislocation?: boolean
}

export interface ChestOrgans {
    lung_fields?: string
    pleura?: string
    heart?: string
    mediastinum?: string
    diaphragm?: string
}

export interface AbdomenOrgans {
    bowel_gas_pattern?: string
    organomegaly?: string
    calcification?: string
    free_air?: boolean
}

export interface SpineOrgans {
    curvature?: SpineCurvature
    vertebral_alignment?: VertebralAlignment
    disc_spaces?: DiscSpaces
    vertebral_fractures?: boolean
    degenerative_changes?: boolean
}

export interface SkullOrgans {
    vault?: string
    base?: string
    sinuses?: string
    orbits?: string
    mandible?: string
}

export interface OrganSpecific {
    chest?: ChestOrgans
    abdomen?: AbdomenOrgans
    spine?: SpineOrgans
    skull?: SkullOrgans
}

export interface XRayFindings {
    skeletal?: SkeletalFindings
    soft_tissues?: SoftTissues
    joint_spaces?: JointSpaces
    organ_specific?: OrganSpecific
}

export interface XRayImpression {
    detailed_summary?: string
    differential_diagnosis?: string[]
    urgency?: UrgencyLevel
}

export interface XRayReport {
    anatomic_region?: AnatomicRegion
    image_quality?: XrayImageQuality
    projection?: Projection
    position?: Position
    findings?: XRayFindings
    impression?: XRayImpression
}

// Ultrasound Report Types
export enum UltrasoundModality {
    TRANSABDOMINAL = "Transabdominal",
    TRANSDUCTAL = "Transductal",
    TRANSLABIAL = "Translabial",
    TRANSVAGINAL = "Transvaginal",
    TRANSRECTAL = "Transrectal",
    TRADITIONAL = "Traditional",
    DOPPLER = "Doppler",
    OTHER = "Other"
}

export type ImageQuality = "Good" | "Moderate" | "Poor"
export type PatientCooperation = "Good" | "Limited" | "Uncooperative"
export type InterpretationAdequacy = "Adequate" | "Inadequate"
export type UltrasoundAnatomicRegion =
    | "Abdomen"
    | "Pelvis"
    | "Cardiac"
    | "Vascular"
    | "Musculoskeletal"
    | "Obstetric"
    | "Gynecological"
    | "Thyroid"
    | "Testicular"
    | "Renal"
    | "Breast"
    | "Soft_Tissue"
    | "Other"

export interface UltrasoundImageQuality {
    resolution?: ImageQuality
    artifact_presence?: boolean
    patient_cooperation?: PatientCooperation
    adequacy_for_interpretation?: InterpretationAdequacy
}

export interface UltrasoundOrganFinding {
    organ?: string
    description?: string
    measurements?: string[]
    vascularity?: string
    echogenicity?: string
}

export interface UltrasoundFindings {
    positive_findings?: UltrasoundOrganFinding[]
    negative_findings?: string[]
    free_fluid?: string
    masses?: string
    other_findings?: string
}

export interface UltrasoundImpression {
    detailed_summary?: string
    diagnosis?: string
    recommendations?: string
}

export interface UltrasoundReport {
    anatomic_region?: UltrasoundAnatomicRegion
    modality?: UltrasoundModality
    image_quality?: UltrasoundImageQuality
    findings?: UltrasoundFindings
    impression?: UltrasoundImpression
}

// Updated ParsedRadiologyData interface to be more comprehensive
export interface ParsedRadiologyData {
    // Common fields for all report types
    detailed_findings?: string
    diagnosis?: string
    clinical_correlation?: string
    clinical_management?: string

    // ECG specific fields
    measurements?: ECGMeasurement
    findings?: ECGFindings | CTFindings | XRayFindings | UltrasoundFindings

    // CT Scan specific fields
    scan_type?: CTScanRegion
    abnormalities?: CTAbnormality[]
    impression?: string | XRayImpression | UltrasoundImpression

    // X-Ray specific fields
    anatomic_region?: AnatomicRegion | UltrasoundAnatomicRegion
    projection?: Projection
    image_quality?: XrayImageQuality | UltrasoundImageQuality

    // Ultrasound specific fields
    modality?: UltrasoundModality

    // Additional fields that might exist in legacy data
    [key: string]: any
}

// Union type for all radiology reports
export type RadiologyReportContent = ECGReport | XRayReport | CTScanReport | UltrasoundReport

// Updated RadiologyReportData interface
export interface RadiologyReportData {
    report_id: string
    content: string | RadiologyReportContent | ParsedRadiologyData
    timestamp: string
    name?: string
    report_type?: string
}

// Report update interface
export interface ReportUpdate {
    name?: string
    patient_id?: string
    content?: RadiologyReportContent
}

export interface VitalSigns {
    blood_pressure?: string
    pulse_rate_bpm?: string
    respiratory_rate?: string
    temperature?: string
    additional_vital_signs?: string[]
}

export interface PhysicalExamination {
    general_appearance?: string
    level_of_consciousness?: string
    vital_signs?: VitalSigns
    skin_and_hydration?: string
    head_and_neck?: HeadAndNeck
    lymph_nodes?: string
    chest_exam?: Chest
    cardiovascular_exam?: Cardiovascular
    abdominal_exam?: Chest
    genitourinary_exam?: string
    neurological_exam?: string
    musculoskeletal_exam?: string
    extremities?: string
    additional_findings?: string[]
}

export interface PhysicalExaminationPlan {
    provisional_diagnosis?: string
    investigations_to_order?: string[]
    medications_to_start?: string[]
    procedures_to_schedule?: string[]
    referrals?: string
    monitoring_instructions?: string
    discharge_or_admission_decision?: string
    patient_education?: string
}

export interface PhysicalExaminationNote extends PhysicalExamination {
    id?: string
    plan?: PhysicalExaminationPlan
    signature?: Signature
}

export interface ProgressNote {
    id?: string
    subjective?: Subjective
    objective?: Objective
    assessment?: Assessment
    plan?: Plan
    signature?: Signature
}

export interface Subjective {
    complaints_today?: string
    functional_status?: string
    pain_socre?: string
    patient_concerns?: string
}

export interface SystemicExam {
    cardiovascular?: string
    respiratory?: string
    abdomen?: string
    neurological?: string
    musculoskeletal?: string
    others?: string[]
}

export interface InputOutput {
    oral_intake?: string
    IV_fluids?: string
    urine_output?: string
    drains_or_catheters?: string
}

export interface Objective {
    vital_signs?: VitalSigns
    systemic_exam?: SystemicExam
    input_output?: InputOutput
    general_exams?: string
}

export interface Diagnosis {
    primary_diagnosis?: string
    secondary_diagnoses?: string[]
}

export interface ManagementPlan {
    medications?: string[]
    fluids_and_nutrition?: string
    labs_or_investigations?: string[]
    procedures?: string
    referrals?: string
    physiotherapy?: string
    discharge_plan?: string
}

export interface Assessment {
    diagnosis?: Diagnosis
    status_update?: string
    complications?: string
    interpretattion_of_investigations?: string
}

export interface Plan {
    management_plan?: ManagementPlan
    instructions_for_nursing?: string
    next_review?: string
}

export interface Signature {
    signed_by?: string
    role?: string
    date_signed?: string
}

export interface OperativeNote {
    id?: string
    preoperative_diagnosis?: string
    postoperative_diagnosis?: string
    indication_for_surgery?: string
    procedure_performed?: string
    date_of_surgery?: string
    surgeon?: string
    assistant_surgeons?: string[]
    anesthetist?: string
    type_of_anesthesia?: string
    findings?: string[]
    procedure_details?: string
    estimated_blood_loss?: string
    complications?: string
    specimens_taken?: string
    drains_inserted?: string
    closure_details?: string
    post_op_instructions?: PostOpInstructions
    plan?: string
    signature?: Signature
}

export interface PostOpInstructions {
    medications?: string[]
    IV_fluids?: string
    NPO_status?: string
    vitals_monitoring?: string
    positioning_and_mobility?: string
    drain_monitoring?: string
    wound_care?: string
}

export interface AdmissionNote {
    id?: string
    date_of_admission?: string
    chief_complaint?: string
    history_of_presenting_illness?: string
    past_medical_history?: string
    past_surgical_history?: string
    drug_history?: string
    allergy_history?: string
    family_history?: string
    social_history?: SocialHistory
    systems_review?: SystemsReview
    physical_examination?: PhysicalExamination
    provisional_diagnosis?: string
    differential_diagnoses?: string[]
    investigations_ordered?: string[]
    initial_management_plan?: InitialManagementPlan
    plan_for_next_review?: string
    signature?: Signature
}

export interface SocialHistory {
    smoking?: string
    alcohol?: string
    occupation?: string
    lifestyle?: string
}

export interface SystemsReview {
    cardiovascular?: string
    respiratory?: string
    gastrointestinal?: string
    genitourinary?: string
    musculoskeletal?: string
    neurological?: string
    integumentary?: string
}

export interface HeadAndNeck {
    scalp?: string
    eyes?: string
    ears?: string
    nose?: string
    throat?: string
}

export interface Chest {
    inspection?: string
    palpation?: string
    percussion?: string
    auscultation?: string
}

export interface Cardiovascular {
    heart_sounds?: string
    pulses?: string
    capillary_refill?: string
}

export interface InitialManagementPlan {
    medications?: string[]
    fluids?: string
    monitoring?: string
    referrals?: string
    nursing_care?: string
}

export interface ProcedureNote {
    id?: string
    procedure_name?: string
    indication_for_procedure?: string
    date_and_time?: string
    location?: string
    performed_by?: string
    assisted_by?: string
    patient_consent?: string
    procedure_details?: string
    findings?: string[]
    complications?: string
    post_procedure_status?: string
    instructions_and_follow_up?: InstructionsAndFollowUp
    signature?: Signature
}

export interface DeathNote {
    id?: string
    date_and_time_of_death?: string
    location_of_death?: string
    name_of_deceased?: string
    age?: string
    sex?: string
    referring_unit_or_team?: string
    brief_history_or_reason_for_admission?: string
    events_leading_to_death?: string
    findings_on_examination?: FindingsOnExamination
    confirmation_of_death?: string
    cause_of_death?: CauseOfDeath
    plan_post_death?: PlanPostDeath
    additional_notes?: string
    signature?: Signature
}

export interface FindingsOnExamination {
    consciousness?: string
    pupils?: string
    heart_sounds?: string
    breath_sounds?: string
    pulses?: string
}

export interface CauseOfDeath {
    immediate_cause?: string
    underlying_cause?: string
    contributing_factors?: string
}

export interface PlanPostDeath {
    family_informed?: string
    body_identification_tagged?: string
    mortuary_transfer?: string
    certificate_of_cause_of_death?: string
}

export interface ReferralNote {
    id?: string
    referring_facility?: string
    referring_clinician?: string
    date_of_referral?: string
    patient_name?: string
    age?: string
    sex?: string
    reason_for_referral?: string
    brief_history?: string
    clinical_findings?: string
    investigations_done?: string[]
    treatment_given?: string[]
    specific_request_or_question?: string
    summary_impression?: string
    additional_notes?: string[]
    signature?: Signature
}

export interface DischargeSummary {
    id?: string
    date_of_admission?: string
    date_of_discharge?: string
    admitting_unit?: string
    consultant?: string
    reason_for_admission?: string
    summary_of_clinical_course?: string
    final_diagnosis?: string
    procedures_done?: string[]
    investigations_and_results?: InvestigationsAndResults
    treatments_given?: string[]
    condition_at_discharge?: string
    discharge_medications?: string[]
    follow_up_plan?: FollowUpPlan
    patient_education_and_counseling?: string
    remarks_or_additional_notes?: string
    signature?: Signature
}

export interface InvestigationsAndResults {
    labs?: string[]
    imaging?: string[]
    others?: string[]
}

export interface FollowUpPlan {
    clinic_review_date?: string
    department?: string
    investigations_to_bring?: string[]
    wound_review_or_suture_removal?: string
}

export interface ReportListItem {
    id?: string
    name?: string
    created_at?: string
    updated_at?: string
    audio_id?: string
    doctor_id?: string
    patient_id?: string
    content: any
    type: ReportType
}

export interface UserConnectionsUser {
    id: string
    user_code: string
    name: string
    role: string
}

export interface UserConnection {
    id: string
    connection_status: ConnectionStatus
    receiver_user_code: string
    created_at: Date
    doctor: UserConnectionsUser
    patient: UserConnectionsUser
}

export enum ConnectionStatus {
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    PENDING = "PENDING"
}

export interface ImportPatientUserData {
    email: string
    id: string
    name: string
    role: string
    user_code: string
}

export interface EduInfoResponse {
    education_points: string[]
}

export interface FollowUpInstruction {
    instruction_number: number
    category: string
    action: string
    timeframe: string
    clinical_rationale: string
}

export interface FollowUpResponse {
    follow_up_instructions: FollowUpInstruction[]
}

export interface MedFindHistoryItem {
    session_id: string
    type?: string
    created_at: Date
    updated_at: Date
    name: string
}

export interface PatientMedFindHistoryItem {
    session_id: string
    type?: string
    created_at: Date
    updated_at: Date
    name: string
}

export enum MedFindMessageType {
    AI = "ai",
    HUMAN = "human"
}

export enum MedFindPatientType {
    AI = "user",
    HUMAN = "assistant"
}

export interface MedFindMessageData {
    content: string
    additional_kwargs: Object
    response_metadata: {
        links: DoctorGptSourceLink[]
    }
    type: MedFindMessageType
    name: string | null
    id: string | null
    example: boolean
    tool_calls?: Array<any>
    invalid_tool_calls?: Array<any>
    usage_metadata?: Object | null
}

export interface PatientMedFindMessageData {
    content: string
    additional_kwargs: Object
    response_metadata: {
        links: PatientsGptSourceLink[]
    }
    type: MedFindPatientType
    name: string | null
    id: string | null
    example: boolean
    tool_calls?: Array<any>
    invalid_tool_calls?: Array<any>
    usage_metadata?: Object | null
}

export interface MedFindMessage {
    type: MedFindMessageType
    data: MedFindMessageData
}

export interface PatientMedFindMessage {
    content: string
    role: MedFindPatientType
    data: PatientMedFindMessageData
}

export interface QuestionnaireHistoryType {
    thread_id: string
    created_at: string
}

//---transcription and medical notes--------------
export interface Message {
    speaker: string
    message: string
}

export interface PatientMedicalData {
    personal_info?: {
        firstname?: string
        nickname?: string
        address?: string
        date_of_admission?: string
        created_at?: string
        patient_id?: string
        id?: string
        lastname?: string
        gender?: string
        date_of_birth?: string
        additional_info?: string | null
        updated_at?: string
    }
    family_history?: {
        family_members?: Array<{
            age?: number
            alive?: boolean
            relation?: string
            current_illnesses?: string[]
        }>
        hereditary_conditions?: string[]
    }
    social_history?: {
        partner_health?: string
        number_of_children?: number
        occupation?: string
        marital_status?: string
        smoking_history?: {
            currently_smokes?: boolean
            previously_smoked?: boolean
            amount_per_day_week?: string
            quit_reason?: string
        }
        travel_history?: {
            has_traveled_abroad?: boolean
            locations?: string[]
        }
        id?: string
        children_health?: string
        financial_worries?: string
        alcohol_history?: {
            drinks_alcohol?: boolean
            units_per_day_week?: string
        }
        pets?: string[]
    }
    systemic_enquiry?: Array<{
        patient_id?: string
        respiratory_symptoms?: string[]
        appetite_weight_changes?: string
        urinary_issues?: string
        musculoskeletal_issues?: string
        psychological_symptoms?: string
        created_at?: string
        chest_issues?: string
        id?: string
        gastrointestinal_symptoms?: string[]
        sexual_health?: string
        neurological_symptoms?: string
        additional_info?: string | null
        updated_at?: string
    }>
    chief_complaints?: Array<{
        id?: string
        presenting_complaints?: string | string[]
        additional_info?: string | null
        updated_at?: string
        hpc?: {
            site?: string
            onset?: string
            timing?: string
            severity?: number
            character?: string
            radiation?: string
            association?: string
            exerbating_and_relieving_factors?: {
                relieving_factors?: string[]
                exacerbating_factors?: string[]
            }
        }
        patient_id?: string
        created_at?: string
    }>
    medical_history?: Array<{
        medical?: {
            details?: string
            critical_conditions?: string[]
        }
        id?: string
        obstetric_gynecological?: null
        created_at?: string
        patient_id?: string
        general?: {
            previous_illnesses?: string[]
        }
        surgical?: {
            surgeries?: string[]
        }
        additional_info?: string
        updated_at?: string
    }>
    drug_history_and_allergies?: Array<{
        medicines?: Array<{
            dose?: string
            name?: string
        }>
        patient_id?: string
        allergies?: Array<{
            allergen?: string
            reaction?: string
        }>
        additional_info?: string | null
        updated_at?: string
        therapies?: { type: string; description: string }[]
        id?: string
        upset_medicines?: { name: string; reaction: string }[]
        created_at?: string
    }>
}

export interface PatientMedicalNotes {
    chief_complaint?: string
    history_of_present_illness?: string
    review_of_systems?: string
    social_history?: string
    family_history?: string
    medication_history_and_allergies?: string
    past_medical_history?: string
    demographics?: {
        name?: string
        age?: number
        occupation?: string
        gender?: string
        residence?: string
    }
    medication_history?: string
    // [key:string]: any // just in case

    /* previous version, not deleting just in case */
    // chief_complaint: {
    //     presenting_complaints: string | string[]
    //     hpc: {
    //         summary: string
    //     }
    //     additional_info: string
    // }
    // drug_and_allergy: Record<string, unknown> | string
    // family_history: Record<string, unknown> | string
    //
    // medical_history: {
    //     general: Record<string, unknown>
    //     medical?: Record<string, unknown>
    //     critical_conditions: string[] | string
    // }
    // personal_details: {
    //     name: string
    //     gender: string
    // }
    // personal_info?: {
    //     name: string
    //     gender: string
    // }
    // social_history: {
    //     marital_status: string
    //     occupation: string
    //     financial_worries?: string
    // }
    // systemic_enquiry: {
    //     appetite_weight_changes: string
    //     gastrointestinal_symptoms: string[]
    //     musculoskeletal_issues: string
    //     neurological_symptoms: string
    //     psychological_symptoms: string
    //     respiratory_symptoms: string[]
    //     sexual_health: string
    //     urinary_issues: string
    // }
    // transcript?: string
}

export interface AIPatientThread {
    thread_id: string
    created_at: Date
    connection?: Partial<UserConnection>
}

export interface PatientPersonalInfo {
    firstname?: string
    nickname?: string
    address?: string
    date_of_admission?: string
    created_at?: Date
    patient_id?: string
    id?: string
    lastname?: string
    gender?: string
    date_of_birth?: string
    additional_info?: string | null
    updated_at?: Date
}

export interface PatientFamilyMember {
    age?: number
    alive?: boolean
    relation?: string
}

export interface PatientFamilyHistory {
    hereditary_conditions?: string[]
    id?: string
    created_at?: Date
    updated_at?: Date
    patient_id?: string
    family_members?: PatientFamilyMember[]
    additional_info?: string
}

export interface PatientAlcoholHistory {
    drinks_alcohol?: boolean
    units_per_day_week?: string
}

export interface PatientSmokingHistory {
    currently_smokes?: boolean
}

export interface PatientTravelHistory {
    has_traveled_abroad?: boolean
}

export interface PatientSocialHistory {
    partner_health?: string
    id?: string
    children_health?: string
    financial_worries?: string
    alcohol_history?: PatientAlcoholHistory
    pets?: string[]
    created_at?: Date
    patient_id?: string
    marital_status?: string
    number_of_children?: number
    occupation?: string
    smoking_history?: PatientSmokingHistory
    travel_history?: PatientTravelHistory
    additional_info?: string
    updated_at?: Date
}

export interface PatientSystemicEnquiry {
    patient_id?: string
    respiratory_symptoms?: string[]
    appetite_weight_changes?: string
    urinary_issues?: string
    musculoskeletal_issues?: string
    psychological_symptoms?: string
    created_at?: Date
    id?: string
    chest_issues?: string
    gastrointestinal_symptoms?: string[]
    sexual_health?: string
    neurological_symptoms?: string
    additional_info?: string | null
    updated_at?: Date
}

export interface PatientExacerbatingAndRelievingFactors {
    relieving_factors?: string[]
    exacerbating_factors?: string[]
}

export interface PatientHPC {
    site?: string
    onset?: string
    timing?: string
    severity?: number
    character?: string
    radiation?: string
    association?: string
    exerbating_and_relieving_factors?: PatientExacerbatingAndRelievingFactors
}

export interface PatientChiefComplaint {
    patient_id?: string
    presenting_complaints?: string
    additional_info?: string | null
    updated_at?: Date
    id?: string
    hpc?: PatientHPC
    created_at?: Date
}

export interface PatientMedicalDetails {
    details?: string
    critical_conditions?: string[]
}

export interface PatientGeneralHistory {
    previous_illnesses?: string[]
}

export interface PatientSurgicalHistory {
    surgeries?: string[]
}

export interface PatientObstetricGynecologicalHistory {}

export interface PatientMedicalHistory {
    medical?: PatientMedicalDetails
    id?: string
    obstetric_gynecological?: PatientObstetricGynecologicalHistory
    created_at?: Date
    general?: PatientGeneralHistory
    patient_id?: string
    surgical?: PatientSurgicalHistory
    additional_info?: string
    updated_at?: Date
}

export interface PatientMedicine {
    name?: string
}

export interface PatientDrugHistoryAndAllergies {
    medicines?: PatientMedicine[]
    patient_id?: string
    allergies?: { allergen?: string; reaction?: string }[]
    additional_info?: string
    updated_at?: Date
    id?: string
    therapies?: string[]
    upset_medicines?: string[]
    created_at?: Date
}

export interface PatientData {
    personal_info?: PatientPersonalInfo
    family_history?: PatientFamilyHistory
    social_history?: PatientSocialHistory
    systemic_enquiry?: PatientSystemicEnquiry[]
    chief_complaints?: PatientChiefComplaint[]
    medical_history?: PatientMedicalHistory[]
    drug_history_and_allergies?: PatientDrugHistoryAndAllergies[]
}

export interface ConnectedPatient {
    id: string
    user_code: string
    name: string
    role: string
    email: string
}

export type ReportData =
    | PhysicalExaminationNote
    | ProgressNote
    | OperativeNote
    | AdmissionNote
    | ProcedureNoteReport
    | DeathNote
    | ReferralNote
    | DischargeSummary

export enum LabTestType {
    BloodTest = "blood_test",
    UrineTest = "urine_test",
    StoolTest = "stool_test",
    Biopsy = "biopsy",
    CultureAndSensitivity = "culture_and_sensitivity"
}

export interface LabTestReportMetadata {
    patient_id?: String
    report_type: LabTestType
    clinical_context?: string
}

export interface LabTestOverallInterpretation {
    summary?: string
    explanation?: string
}

export interface LabTestDifferentialDiagnosis {
    diagnosis?: string
    explanation?: string
}

export interface LabTestFlags {
    critical_values?: string[]
    abnormal_values?: string[]
}

export interface LabTestPanelSummary {
    analytes_detailed_summary?: string
    overall_interpretation?: LabTestOverallInterpretation
    differential_diagnoses?: LabTestDifferentialDiagnosis[]
    clinical_recommendations?: string[]
    urgency?: "Routine" | "Review_Soon" | "Urgent" | "Critical"
    flags?: LabTestFlags
}

export interface LabTestGlobalSummary {
    most_important_findings?: string[]
    next_steps?: string[]
    urgency_overall?: "Routine" | "Review_Soon" | "Urgent" | "Critical"
}
export interface GeneralLabTestReport {
    panel_summaries?: LabTestPanelSummary[]
    global_summary?: LabTestGlobalSummary
}

export interface LabTestReportUpdate {
    name?: string
    patient_id?: string
    content?: GeneralLabTestReport
}

// Organization Types
export interface OrganizationCredits {
    pool: number
    individual: number
    role: {
        doctor: number
        radiologist: number
        pharmacy: number
    }
}

export interface OrganizationDailyLimits {
    pool: number
    individual: number
    role: {
        doctor: number
        radiologist: number
        pharmacy: number
    }
}

export interface User {
    id: string
    name: string
    email: string
    role: string
    credits: number
    avatar?: string
}

export interface RoleCredit {
    role: string
    credits: number
    users: number
    description: string
}

export interface Organization {
    id?: string
    name: string
    description: string
    profile_picture_id?: string
    credits: number
    credit_usage_type: "pool" | "individual" | "role"
    daily_credit_limit: OrganizationDailyLimits
    connection_access: "all" | "restricted"
    owner_id?: string
    created_at?: string
    updated_at?: string
}

export interface CreateOrganizationRequest {
    name: string
    description: string
    profile_picture_id?: string | undefined
    credit_usage_type: "pool" | "individual" | "role"
    connection_access: "all" | "restricted"
}

export interface UpdateOrganizationRequest {
    name?: string
    description?: string
    profile_picture_id?: string
    credits?: OrganizationCredits
    credit_usage_type?: "pool" | "individual" | "role"
    daily_credit_limit?: OrganizationDailyLimits
    connection_access?: "all" | "restricted"
    owner_id?: string
}

// Organization Invitations
export interface OrganizationInvitation {
    name: string
    email: string
    role: string
}

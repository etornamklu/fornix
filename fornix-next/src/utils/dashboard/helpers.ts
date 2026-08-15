import { DashboardPath, ReportType } from "@/utils/types"

export const getDashboardPathReportType = (path: DashboardPath): ReportType => {
    switch (path) {
        case DashboardPath.Examination:
            return ReportType.PhysicalExamination
        case DashboardPath.HistoryTaking:
            return ReportType.HistoryTaking
        case DashboardPath.ProgressNotes:
            return ReportType.ProgressNote
        case DashboardPath.HistoryTaking:
            return ReportType.HistoryTaking
        case DashboardPath.OperativeNotes:
            return ReportType.OperativeNote
        case DashboardPath.ReferralNotes:
            return ReportType.ReferralNote
        case DashboardPath.DischargeSummary:
            return ReportType.DischargeSummary
        case DashboardPath.AdmissionNotes:
            return ReportType.AdmissionNote
        case DashboardPath.ProcedureNote:
            return ReportType.ProcedureNote

        default:
            throw new Error(`Unsupported report type for path: ${path}`)
    }
}

export const flattenToString = (data: any, depth = 0): string => {
    if (data === null || data === undefined || data === "") {
        return ""
    }
    if (typeof data !== "object") {
        return String(data)
    }
    if (Array.isArray(data)) {
        return data
            .map(item => flattenToString(item, depth + 1))
            .filter(Boolean)
            .join(", ")
    }

    return Object.entries(data)
        .map(([key, value]) => {
            const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
            const flattenedValue = flattenToString(value, depth + 1)

            if (flattenedValue) {
                // THE FIX: Always return "Key: Value", which matches the clipboard logic.
                // The check for `depth > 0` was removed.
                return `${formattedKey}: ${flattenedValue}`
            }
            return ""
        })
        .filter(Boolean)
        .join("\n") // Use newline for different keys at the same level
}

// Report type specific sections
export const REPORT_SPECIFIC_SECTIONS: Record<ReportType, string[]> = {
    [ReportType.PhysicalExamination]: [
        "general_appearance",
        "level_of_consciousness",
        "vital_signs",
        "skin_and_hydration",
        "head_and_neck",
        "lymph_nodes",
        "chest_exam",
        "cardiovascular_exam",
        "abdominal_exam",
        "genitourinary_exam",
        "neurological_exam",
        "musculoskeletal_exam",
        "extremities",
        "additional_findings",
        "plan",
        "signature"
    ],
    [ReportType.ProgressNote]: ["subjective", "objective", "assessment", "plan"],
    [ReportType.AdmissionNote]: [
        "date_of_admission",
        "chief_complaint",
        "history_of_presenting_illness",
        "past_medical_history",
        "past_surgical_history",
        "drug_history",
        "allergy_history",
        "family_history",
        "social_history",
        "systems_review",
        "physical_examination",
        "provisional_diagnosis",
        "differential_diagnoses",
        "investigations_ordered",
        "initial_management_plan",
        "plan_for_next_review",
        "signature"
    ],
    [ReportType.OperativeNote]: [
        "preoperative_diagnosis",
        "postoperative_diagnosis",
        "indication_for_surgery",
        "procedure_performed",
        "date_of_surgery",
        "surgeon",
        "assistant_surgeons",
        "anesthetist",
        "type_of_anesthesia",
        "findings",
        "procedure_details",
        "estimated_blood_loss",
        "complications",
        "specimens_taken",
        "drains_inserted",
        "closure_details",
        "post_op_instructions",
        "plan",
        "signature"
    ],
    [ReportType.ProcedureNote]: [
        "procedure_name",
        "indication_for_procedure",
        "date_and_time",
        "location",
        "performed_by",
        "assisted_by",
        "patient_consent",
        "procedure_details",
        "findings",
        "complications",
        "post_procedure_status",
        "instructions_and_follow_up",
        "signature"
    ],
    [ReportType.DischargeSummary]: [
        "date_of_admission",
        "date_of_discharge",
        "admitting_unit",
        "consultant",
        "reason_for_admission",
        "summary_of_clinical_course",
        "final_diagnosis",
        "procedures_done",
        "investigations_and_results",
        "treatments_given",
        "condition_at_discharge",
        "discharge_medications",
        "follow_up_plan",
        "patient_education_and_counseling",
        "remarks_or_additional_notes",
        "signature"
    ],
    [ReportType.DeathNote]: [
        "time_of_death",
        "cause_of_death",
        "circumstances",
        "family_notification",
        "autopsy_information"
    ],
    [ReportType.ReferralNote]: [
        "referring_facility",
        "referring_clinician",
        "date_of_referral",
        "patient_name",
        "age",
        "sex",
        "reason_for_referral",
        "brief_history",
        "clinical_findings",
        "investigations_done",
        "treatment_given",
        "specific_request_or_question",
        "summary_impression",
        "additional_notes",
        "signature"
    ],
    [ReportType.HistoryTaking]: [
        "demographics",
        "chief_complaint",
        "history_of_present_illness",
        "review_of_systems",
        "social_history",
        "medication_history",
        "past_medical_history",
        "family_history"
    ]
}

export const getPathFromReportType = (type: ReportType): DashboardPath => {
    switch (type) {
        case ReportType.PhysicalExamination:
            return DashboardPath.Examination
        case ReportType.HistoryTaking:
            return DashboardPath.HistoryTaking
        case ReportType.ProgressNote:
            return DashboardPath.ProgressNotes
        case ReportType.OperativeNote:
            return DashboardPath.OperativeNotes
        case ReportType.ReferralNote:
            return DashboardPath.ReferralNotes
        case ReportType.DischargeSummary:
            return DashboardPath.DischargeSummary
        case ReportType.AdmissionNote:
            return DashboardPath.AdmissionNotes
        case ReportType.ProcedureNote:
            return DashboardPath.ProcedureNote
        default:
            return DashboardPath.Base
    }
}

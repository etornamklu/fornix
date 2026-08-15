import { DashboardPath } from "@/utils/types"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { getDashboardPathReportType } from "@/utils/dashboard/helpers"

/*
 * Centralised metadata for each sidebar tab.
 * The Navbar component will read from this table instead of hard-coded conditionals.
 * Adding a new section (e.g., Radiography) becomes a single entry here.
 */
export interface TabConfig {
    label: string // Header title shown above the list
    searchPlaceholder: string // Placeholder text inside the search input
    showPatientFilter: boolean // Whether to render <PatientFilter>
    category: string // Category string used when composing global search data
    onAddNew?: () => void // Optional handler for the (+) button
}

// Dashboard paths that correspond to ACC reports and share the same behaviour (ReportList renderer)
const REPORT_PATHS: DashboardPath[] = [
    DashboardPath.HistoryTaking,
    DashboardPath.Examination,
    DashboardPath.ProgressNotes,
    DashboardPath.OperativeNotes,
    DashboardPath.AdmissionNotes,
    DashboardPath.DischargeSummary,
    DashboardPath.ProcedureNote,
    DashboardPath.ReferralNotes
]

// Factory to build TabConfig for ACC report tabs
const makeReportConfig = (path: DashboardPath): TabConfig => {
    const pretty = getDashboardPathReportType(path).replace("_", " ")
    return {
        label: `${pretty} History`,
        searchPlaceholder: `Search ${pretty}...`,
        showPatientFilter: true,
        category: pretty
    }
}

export const TAB_CONFIG: Partial<Record<DashboardPath, TabConfig>> = {
    [DashboardPath.MedFind]: {
        label: "Medfind History",
        searchPlaceholder: "Search MedFind...",
        showPatientFilter: false,
        category: "MedFind",
        onAddNew: () => {
            localStorage.setItem("mfi", "")
            localStorage.removeItem("mfi")
            window.dispatchEvent(new Event("storage"))
        }
    },
    [DashboardPath.Diagnosis]: {
        label: "Patient History",
        searchPlaceholder: "Search Patient...",
        showPatientFilter: true,
        category: "Diagnoses",
        onAddNew: clearAllDiagnosisData
    },
    [DashboardPath.ImportSummary]: {
        label: "Import Summary History",
        searchPlaceholder: "Search Import Summary...",
        showPatientFilter: false,
        category: "Import Summary"
    },
    // ACC report paths (generated)
    ...Object.fromEntries(REPORT_PATHS.map(p => [p, makeReportConfig(p)])),
    [DashboardPath.Conversation]: {
        label: "Conversations",
        searchPlaceholder: "Search Conversations...",
        showPatientFilter: true,
        category: "Conversations"
    },
    [DashboardPath.PatientMedFind]: {
        label: "Search History",
        searchPlaceholder: "Search by name...",
        showPatientFilter: false,
        category: "Patient MedFind",
        onAddNew: () => {
            localStorage.setItem("pmfi", "")
            localStorage.removeItem("pmfi")
            window.dispatchEvent(new Event("storage"))
        }
    }
    // When Radiography is introduced, add:
    // [DashboardPath.Radiography]: { ... }
}

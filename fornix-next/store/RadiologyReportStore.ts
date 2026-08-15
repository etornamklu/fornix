import { create } from "zustand"
import { RadiologyReport } from "@/utils/types"
import { getReportById, ReportDetails } from "@/services/dashboard/radiology.service"

interface RadiologyReportState {
    selectedReportId: string | null
    activeReport: RadiologyReport | null
    isLoading: boolean
    error: string | null
    reports: RadiologyReport[]
    fetchReports: () => Promise<void>
    addOrUpdateReport: (report: RadiologyReport) => void
    setSelectedReportId: (id: string | null) => void
    setActiveReport: (report: RadiologyReport | null) => void
    fetchReport: (reportId: string) => Promise<void>
    clearReport: () => void
}

export const useRadiologyReportStore = create<RadiologyReportState>((set, get) => ({
    selectedReportId: null,
    activeReport: null,
    isLoading: false,
    error: null,
    reports: [],

    setSelectedReportId: (id: string | null) => set({ selectedReportId: id }),

    setActiveReport: (report: RadiologyReport | null) => set({ activeReport: report }),

    fetchReports: async () => {
        // <-- ADD THIS
        set({ isLoading: true, error: null })
        try {
            const data = await import("@/services/dashboard/radiology.service").then(mod => mod.getRadiologyReports())
            set({ reports: data, isLoading: false })
        } catch (err) {
            set({ error: "Failed to fetch radiology reports", isLoading: false })
        }
    },

    addOrUpdateReport: report => {
        // <-- ADD THIS
        const reports = get().reports
        const filtered = reports.filter(r => r.id !== report.id)
        set({ reports: [report, ...filtered] })
    },

    fetchReport: async (reportId: string) => {
        set({ isLoading: true, error: null })
        try {
            const reportDetails: ReportDetails = await getReportById(reportId)

            // Convert ReportDetails to RadiologyReport format
            const radiologyReport: RadiologyReport = {
                id: reportDetails.id,
                name: reportDetails.name,
                created_at: reportDetails.created_at,
                patient_id: reportDetails.patient_id || undefined,
                report_type: reportDetails.type as any,
                patient_name: undefined,
                content: reportDetails.content
            }

            set({ activeReport: radiologyReport, selectedReportId: reportId, isLoading: false })
        } catch (error) {
            set({ error: "Failed to fetch report", isLoading: false })
        }
    },

    clearReport: () => set({ selectedReportId: null, activeReport: null, error: null })
}))

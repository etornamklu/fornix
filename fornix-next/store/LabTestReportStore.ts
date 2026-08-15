import { create } from "zustand"
import { ReportDetails, ReportListItem } from "@/services/dashboard/radiology.service"
import { getLabTestReportById, getLabTestReports } from "@/services/dashboard/radiology.service"

interface LabTestReportState {
    selectedReportId: string | null
    activeReport: ReportDetails | null
    isLoading: boolean
    error: string | null
    reports: ReportListItem[]
    fetchReports: () => Promise<void>
    addOrUpdateReport: (report: ReportListItem) => void
    setSelectedReportId: (id: string | null) => void
    setActiveReport: (report: ReportDetails | null) => void
    fetchReport: (reportId: string) => Promise<void>
    clearReport: () => void
}

export const useLabTestReportStore = create<LabTestReportState>((set, get) => ({
    selectedReportId: null,
    activeReport: null,
    isLoading: false,
    error: null,
    reports: [],

    setSelectedReportId: (id: string | null) => set({ selectedReportId: id }),

    setActiveReport: (report: ReportDetails | null) => set({ activeReport: report }),

    fetchReports: async () => {
        set({ isLoading: true, error: null })
        try {
            const data = await getLabTestReports()
            set({ reports: data, isLoading: false })
        } catch (err) {
            set({ error: "Failed to fetch lab test reports", isLoading: false })
        }
    },

    addOrUpdateReport: report => {
        const reports = get().reports
        const filtered = reports.filter(r => r.id !== report.id)
        set({ reports: [report, ...filtered] })
    },

    fetchReport: async (reportId: string) => {
        set({ isLoading: true, error: null })
        try {
            const reportDetails = await getLabTestReportById(reportId)
            set({ activeReport: reportDetails, selectedReportId: reportId, isLoading: false })
        } catch (error) {
            set({ error: "Failed to fetch lab test report", isLoading: false })
        }
    },

    clearReport: () => set({ selectedReportId: null, activeReport: null, error: null })
}))

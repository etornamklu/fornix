import { create } from "zustand"
import { DashboardPath, Report, ReportType } from "@/utils/types"
import { getAllReports, getReportById, getAllReportTypes } from "@/services/dashboard/report.service"
import { getDashboardPathReportType } from "@/utils/dashboard/helpers"
import { report } from "process"

type ReportStore = {
    allReports: Report[]
    reports: Report[]
    selectedReport: Report | null
    selectedReportId: string | null
    error: string | null
    individualReportError: string | null
    isLoading: boolean
    reportType: DashboardPath
    activeReport: Report | null

    getAllReports: () => Promise<void>
    filterReportsByType: (type: ReportType | null) => void
    fetchReports: (type: DashboardPath) => Promise<void>
    setSelectedReportId: (id: string) => void
    handleReportCreated: (report: Report) => void
    handleReportUpdated: (report: Report) => void
    handleReportDeleted: (id: string) => void
    setActiveReport: (report: Report | null) => void
    clearActiveReport: () => void
    fetchReportById: (id: string) => Promise<void>
    clearIndividualReportError: () => void
}

export const useReportStore = create<ReportStore>((set, get) => ({
    allReports: [],
    reports: [],
    selectedReport: null,
    selectedReportId: null,
    error: null,
    individualReportError: null,
    isLoading: false,
    activeReport: null,
    reportType: DashboardPath.Base,

    getAllReports: async () => {
        // if (get().allReports.length > 0) return
        set({ isLoading: true })
        try {
            const data = await getAllReportTypes()
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0)
                const dateB = new Date(b.updated_at || b.created_at || 0)
                return dateB.getTime() - dateA.getTime()
            })

            const mappedData: Report[] = sortedData
                .filter(item => item.id && item.name)
                .map(item => ({
                    id: item.id!,
                    name: item.name!,
                    doctor_id: item.doctor_id || "",
                    patient_id: item.patient_id || undefined,
                    type: item.type,
                    audio_id: item.audio_id || "",
                    content: item.content || {},
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }))

            set({ allReports: mappedData, reports: mappedData, error: null, isLoading: false })
        } catch (err: any) {
            set({
                error: err?.message || JSON.stringify(err) || "Failed to fetch reports",
                isLoading: false
            })
            console.error(err)
        }
    },

    filterReportsByType: (type: ReportType | null) => {
        const { allReports } = get()
        if (type === null) {
            set({ reports: allReports })
        } else {
            const filtered = allReports.filter(report => report.type === type)
            set({ reports: filtered })
        }
    },

    fetchReports: async (type: DashboardPath) => {
        set({ isLoading: true })
        try {
            const reportType = getDashboardPathReportType(type)
            const data = await getAllReports(reportType)
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0)
                const dateB = new Date(b.updated_at || b.created_at || 0)
                return dateB.getTime() - dateA.getTime()
            })

            const mappedData: Report[] = sortedData
                .filter(item => item.id && item.name)
                .map(item => ({
                    id: item.id!,
                    name: item.name!,
                    doctor_id: item.doctor_id || "",
                    patient_id: item.patient_id || undefined,
                    type: reportType,
                    audio_id: item.audio_id || "",
                    content: item.content || {},
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }))

            set({ reports: mappedData, error: null, isLoading: false })
        } catch (err: any) {
            set({ error: err.message || "Failed to fetch reports", isLoading: false })
        }
    },
    setSelectedReportId: (id: string) => {
        set({ selectedReportId: id })
    },

    setActiveReport: (report: Report | null) => {
        set({ activeReport: report })
    },

    clearActiveReport: () => {
        set({ activeReport: null, selectedReportId: null })
    },

    fetchReportById: async (id: string) => {
        set({ isLoading: true, individualReportError: null })
        try {
            // This service call returns an object from the server
            const serverReport = await getReportById(id)

            // We need to map the server object to our internal Report type.
            // This time, we use the correct property names: 'id' and 'name'.
            const normalizedReport: Report = {
                id: serverReport.id,
                name: serverReport.name,
                patient_id: serverReport.patient_id,
                type: serverReport.type,
                content: serverReport.content || {},
                doctor_id: serverReport.doctor_id,
                audio_id: serverReport.audio_id,
                created_at: serverReport.created_at,
                updated_at: serverReport.updated_at
            }

            // Update both activeReport and allReports to ensure navbar is updated
            const { allReports } = get()
            const existingReportIndex = allReports.findIndex(r => r.id === id)

            let newAllReports = [...allReports]
            if (existingReportIndex >= 0) {
                // Update existing report
                newAllReports[existingReportIndex] = normalizedReport
            } else {
                // Add new report to the beginning
                newAllReports = [normalizedReport, ...allReports].sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at || 0)
                    const dateB = new Date(b.updated_at || b.created_at || 0)
                    return dateB.getTime() - dateA.getTime()
                })
            }

            // Now we set both the active report and update the navbar list
            set({
                activeReport: normalizedReport,
                allReports: newAllReports,
                reports: newAllReports,
                isLoading: false,
                individualReportError: null
            })
        } catch (err: any) {
            set({ individualReportError: err.message || "Failed to fetch report", isLoading: false })
        }
    },
    handleReportCreated: report => {
        const { allReports } = get()
        const newAllReports = [report, ...allReports].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0)
            const dateB = new Date(b.updated_at || b.created_at || 0)
            return dateB.getTime() - dateA.getTime()
        })
        set({ allReports: newAllReports, reports: newAllReports, activeReport: report })
    },

    handleReportUpdated: (report: Report) => {
        const { allReports } = get()
        const updatedAllReports = allReports.map(r => (r.id === report.id ? report : r))

        set({
            allReports: updatedAllReports,
            reports: updatedAllReports,
            activeReport: report, // ✅ use the fresh updated report
        })
    },


    handleReportDeleted: (id: string) => {
        const { allReports } = get()
        const newAllReports = allReports.filter(r => r.id !== id)
        set({
            allReports: newAllReports,
            reports: newAllReports
        })
    },
    clearIndividualReportError: () => {
        set({ individualReportError: null })
    }
}))

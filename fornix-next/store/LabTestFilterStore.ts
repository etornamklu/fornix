import { create } from "zustand"
import { LabTestType } from "@/utils/types"
import { ReportListItem } from "@/services/dashboard/radiology.service"

interface LabTestFilterState {
    selectedTypes: LabTestType[]
    setSelectedTypes: (types: LabTestType[]) => void
    filterReportsByType: (reports: ReportListItem[]) => ReportListItem[]
}

export const useLabTestFilterStore = create<LabTestFilterState>((set, get: () => LabTestFilterState) => ({
    selectedTypes: [],
    setSelectedTypes: (types: LabTestType[]) => set({ selectedTypes: types }),
    filterReportsByType: (reports: ReportListItem[]): ReportListItem[] => {
        const { selectedTypes } = get()

        if (selectedTypes.length === 0) return reports

        return reports.filter(report => {
            if (!report.report_type) return false

            const matches = selectedTypes.some(type => {
                const normalizedType = type.toLowerCase().replace(/[\s_\-]/g, "")
                const normalizedReportType = report.report_type?.toLowerCase().replace(/[\s_\-]/g, "")
                return normalizedType === normalizedReportType
            })

            return matches
        })
    }
}))

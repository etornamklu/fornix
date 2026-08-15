// In store/RadiologyFilterStore.ts
import { create } from "zustand"
import { RadiologyReportType } from "@/components/dashboard/navbar/radiology/RadiologyTypeFilter"
import { RadiologyReport } from "@/utils/types"

interface RadiologyFilterState {
    selectedTypes: RadiologyReportType[]
    setSelectedTypes: (types: RadiologyReportType[]) => void
    filterReportsByType: (reports: RadiologyReport[]) => RadiologyReport[]
}

export const useRadiologyFilterStore = create<RadiologyFilterState>((set, get: () => RadiologyFilterState) => ({
    selectedTypes: [],
    setSelectedTypes: (types: RadiologyReportType[]) => set({ selectedTypes: types }),
    filterReportsByType: (reports: RadiologyReport[]): RadiologyReport[] => {
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

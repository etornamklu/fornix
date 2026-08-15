import React, { useMemo, useState, useEffect } from "react"
import { NavbarHeader } from "../NavbarHeader"
import { NavbarSearch } from "../NavbarSearch"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { useRadiologyReportStore } from "../../../../../store/RadiologyReportStore"
import { useLabTestReportStore } from "../../../../../store/LabTestReportStore"
import { useRadiologyFilterStore } from "../../../../../store/RadiologyFilterStore"
import { useLabTestFilterStore } from "../../../../../store/LabTestFilterStore"
import { RadiologyReport } from "@/utils/types"
import { ReportListItem } from "@/services/dashboard/radiology.service"
import { useRouter } from "next/navigation"
import { LabTestType } from "@/utils/types"
import CombinedTypeFilter, { CombinedReportType } from "./CombinedTypeFilter"

interface CombinedReport {
    id: string
    name: string
    created_at: string
    type: "radiology" | "lab_test"
    reportType: string | undefined
}

interface CombinedReportsNavbarSectionProps {
    onReportClick: (report: CombinedReport) => void
}

export function CombinedReportsNavbarSection({ onReportClick }: CombinedReportsNavbarSectionProps) {
    const [search, setSearch] = useState("")
    const router = useRouter()
    const [selectedTypes, setSelectedTypes] = useState<CombinedReportType[]>([])

    // Radiology stores
    const {
        reports: radiologyReports,
        setSelectedReportId: setRadiologyReportId,
        fetchReport: fetchRadiologyReport
    } = useRadiologyReportStore()

    const {
        selectedTypes: radiologySelectedTypes,
        setSelectedTypes: setRadiologySelectedTypes,
        filterReportsByType: filterRadiologyReportsByType
    } = useRadiologyFilterStore()

    // Lab test stores
    const {
        reports: labTestReports,
        setSelectedReportId: setLabTestReportId,
        fetchReport: fetchLabTestReport
    } = useLabTestReportStore()
    const {
        selectedTypes: labTestSelectedTypes,
        setSelectedTypes: setLabTestSelectedTypes,
        filterReportsByType: filterLabTestReportsByType
    } = useLabTestFilterStore()

    useEffect(() => {
        const fetchReports = async () => {
            await Promise.all([
                useRadiologyReportStore.getState().fetchReports(),
                useLabTestReportStore.getState().fetchReports()
            ])
        }
        fetchReports()
    }, [])

    // Combine and filter reports
    const combinedReports = useMemo(() => {
        const radiology = radiologyReports.map(report => ({
            id: report.id,
            name: report.name,
            created_at: report.created_at,
            type: "radiology" as const,
            reportType: report.report_type
        }))

        const labTests = labTestReports.map(report => ({
            id: report.id!,
            name: report.name!,
            created_at: report.created_at!,
            type: "lab_test" as const,
            reportType: report.report_type!
        }))

        return [...radiology, ...labTests]
    }, [radiologyReports, labTestReports])

    const filteredReports = useMemo(() => {
        let filtered = combinedReports.filter(report => report.name.toLowerCase().includes(search.toLowerCase()))

        if (selectedTypes.length > 0) {
            filtered = filtered.filter(report => {
                if (!report.reportType) return false

                const matches = selectedTypes.some(type => {
                    const normalizedType = type.toLowerCase().replace(/[\s_\-]/g, "")
                    const normalizedReportType = report.reportType?.toLowerCase().replace(/[\s_\-]/g, "")
                    return normalizedType === normalizedReportType
                })

                return matches
            })
        }

        return filtered
    }, [combinedReports, search, selectedTypes])

    // Sort by creation date (newest first)
    const sortedReports = useMemo(() => {
        return filteredReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [filteredReports])

    const handleReportClick = async (report: CombinedReport) => {
        if (report.type === "radiology") {
            setRadiologyReportId(report.id)
            await fetchRadiologyReport(report.id)
            router.push("/dashboard/radiology")
        } else {
            setLabTestReportId(report.id)
            await fetchLabTestReport(report.id)
            router.push("/dashboard/lab-test")
        }
    }

    return (
        <div className="flex flex-1 overflow-y-auto flex-col w-full pb-6">
            <NavbarHeader
                label="All Reports"
                onAddNew={() => {
                    console.log("Add new report")
                }}
            />

            {combinedReports.length > 0 && (
                <div className="w-full mt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search all reports..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none flex-1"
                        />
                        <CombinedTypeFilter selectedTypes={selectedTypes} onTypeSelect={setSelectedTypes} />
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {sortedReports.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-gray-500">No reports found</div>
                    </div>
                ) : (
                    <div className="mt-4 text-xs overflow-y-auto overflow-x-hidden">
                        {sortedReports.map((report, index) => (
                            <div
                                key={`${report.type}-${report.id}`}
                                role="button"
                                onClick={() => handleReportClick(report)}
                                className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none min-w-0">
                                <span className="truncate overflow-hidden whitespace-nowrap min-w-0 flex-1">
                                    {report.name}
                                </span>
                                <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full flex-shrink-0">
                                    <CgArrowsExpandUpRight size={23} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CombinedReportsNavbarSection

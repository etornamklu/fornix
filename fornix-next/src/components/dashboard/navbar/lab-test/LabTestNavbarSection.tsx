import React, { useState, useMemo, useEffect } from "react"
import { FaCirclePlus } from "react-icons/fa6"
import { LabTestReportsList } from "./LabTestReportList"
import { NavbarHeader } from "../NavbarHeader"
import { NavbarSearch } from "../NavbarSearch"
import { ReportListItem } from "@/services/dashboard/radiology.service"
import { LabTestTypeFilter, LabTestReportType } from "./LabTestTypeFilter"
import { useLabTestFilterStore } from "../../../../../store/LabTestFilterStore"
import { useLabTestReportStore } from "../../../../../store/LabTestReportStore"

interface LabTestNavbarSectionProps {
    onReportClick: (report: ReportListItem) => void
}

export function LabTestNavbarSection({ onReportClick }: LabTestNavbarSectionProps) {
    const { reports, error, fetchReports } = useLabTestReportStore()
    const [search, setSearch] = useState("")
    const { selectedTypes, setSelectedTypes, filterReportsByType } = useLabTestFilterStore()

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    const searchedReports = useMemo(
        () => reports.filter(report => report.name?.toLowerCase().includes(search.toLowerCase())),
        [reports, search]
    )

    const typeFilteredReports = useMemo(() => {
        console.log("Desktop - Filtering lab test reports with types:", selectedTypes)
        return filterReportsByType(searchedReports)
    }, [searchedReports, selectedTypes])

    console.log("Selected Types:", selectedTypes)

    return (
        <div className="flex flex-1 overflow-y-auto flex-col w-full pb-6">
            <NavbarHeader
                label="Lab Test Reports"
                onAddNew={() => {
                    console.log("Add new lab test report")
                }}
            />

            {reports.length > 0 && (
                <div className="w-full mt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search lab test reports..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none flex-1"
                        />
                        <LabTestTypeFilter selectedTypes={selectedTypes} onTypeSelect={setSelectedTypes} />
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {error ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-red-500">{error}</div>
                    </div>
                ) : typeFilteredReports.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-gray-500">No reports found</div>
                    </div>
                ) : (
                    <LabTestReportsList
                        reports={typeFilteredReports}
                        onItemClick={(report: ReportListItem) => {
                            console.log("Clicked report:", report)
                            onReportClick(report)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default LabTestNavbarSection

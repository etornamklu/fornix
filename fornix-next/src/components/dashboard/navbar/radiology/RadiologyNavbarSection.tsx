import React, { useState, useMemo } from "react"
import { FaCirclePlus } from "react-icons/fa6"
import { RadiologyReportsList } from "./RadiologyReportsList"
import { useRadiologyNavbar } from "./useRadiologyNavbar"
import { NavbarHeader } from "../NavbarHeader"
import { NavbarSearch } from "../NavbarSearch"
import { RadiologyReport } from "@/utils/types"
import { RadiologyTypeFilter, RadiologyReportType } from "./RadiologyTypeFilter"
import { useRadiologyFilterStore } from "../../../../../store/RadiologyFilterStore"
import { useRadiologyReportStore } from "../../../../../store/RadiologyReportStore"

interface RadiologyNavbarSectionProps {
    onReportClick: (report: RadiologyReport) => void
}

export function RadiologyNavbarSection({ onReportClick }: RadiologyNavbarSectionProps) {
    const { reports, error } = useRadiologyReportStore()
    const [search, setSearch] = useState("")
    const { selectedTypes, setSelectedTypes, filterReportsByType } = useRadiologyFilterStore()

    const searchedReports = useMemo(
        () => reports.filter(report => report.name.toLowerCase().includes(search.toLowerCase())),
        [reports, search]
    )

    const typeFilteredReports = useMemo(() => {
        console.log("Desktop - Filtering reports with types:", selectedTypes)
        return filterReportsByType(searchedReports)
    }, [searchedReports, selectedTypes])

    console.log("Selected Types:", selectedTypes)

    return (
        <div className="flex flex-1 overflow-y-auto flex-col w-full pb-6">
            <NavbarHeader
                label="Radiology Reports"
                onAddNew={() => {
                    // Handle add new report if needed
                    console.log("Add new radiology report")
                }}
            />

            {reports.length > 0 && (
                <div className="w-full mt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search radiology reports..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none flex-1"
                        />
                        <RadiologyTypeFilter selectedTypes={selectedTypes} onTypeSelect={setSelectedTypes} />
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
                    <RadiologyReportsList
                        reports={typeFilteredReports}
                        onItemClick={(report: RadiologyReport) => {
                            console.log("Clicked report:", report)
                            onReportClick(report)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

import React, { useMemo, useState } from "react"
import { useMobileRadiologyNavbar } from "./useMobileRadiologyNavbar"
import { NavbarHeader } from "../NavbarHeader"
import { NavbarSearch } from "../NavbarSearch"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { RadiologyTypeFilter, RadiologyReportType } from "./RadiologyTypeFilter"
import { useRadiologyFilterStore } from "../../../../../store/RadiologyFilterStore"
import { RadiologyReport } from "@/utils/types"
import { useRadiologyReportStore } from "../../../../../store/RadiologyReportStore"
import { useRouter } from "next/navigation"

interface MobileRadiologyNavbarSectionProps {
    onReportClick: (report: RadiologyReport) => void
}

export function MobileRadiologyNavbarSection({ onReportClick }: MobileRadiologyNavbarSectionProps) {
    const { reports, setSelectedReportId, fetchReport } = useRadiologyReportStore()
    const [search, setSearch] = useState("")
    const { selectedTypes, setSelectedTypes, filterReportsByType } = useRadiologyFilterStore()
    const router = useRouter()

    const filteredReports = useMemo(
        () => reports.filter(report => report.name.toLowerCase().includes(search.toLowerCase())),
        [reports, search]
    )

    const typeFilteredReports = useMemo(() => {
        console.log("Filtering reports with types:", selectedTypes)
        return filterReportsByType(filteredReports)
    }, [filteredReports, selectedTypes])

    const handleReportClick = async (report: RadiologyReport) => {
        setSelectedReportId(report.id)
        await fetchReport(report.id)
        router.push("/dashboard/radiology")
    }

    return (
        <>
            <NavbarHeader
                label="Radiology Reports"
                onAddNew={() => {
                    console.log("Add new radiology report")
                    /* onReportClick(report) */
                }}
            />

            {reports.length > 0 && (
                <div className="mt-2">
                    <div className="flex items-enter gap-2">
                        <input
                            type="text"
                            placeholder="Search radiology reports..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none flex-1"
                        />
                        {/*  <NavbarSearch
                            placeholder="Search radiology reports..."
                            searchData={typeFilteredReports}
                            activeCategory="radiology"
                            onResultClick={report => {
                                console.log("Selected report:", report)
                                onReportClick(report)
                            }}
                            searchQuery={search}
                            onSearchChange={setSearch}
                        /> */}
                        <RadiologyTypeFilter selectedTypes={selectedTypes} onTypeSelect={setSelectedTypes} />
                    </div>
                </div>
            )}

            <div className="mt-4 text-xs overflow-y-auto overflow-x-hidden">
                {typeFilteredReports.map((report, index) => (
                    <div
                        key={index}
                        role="button"
                        onClick={() => {
                            handleReportClick(report)
                            onReportClick(report)
                        }}
                        className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none min-w-0">
                        <span className="truncate overflow-hidden whitespace-nowrap min-w-0 flex-1">{report.name}</span>
                        <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full flex-shrink-0">
                            <CgArrowsExpandUpRight size={23} />
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

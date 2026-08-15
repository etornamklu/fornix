import React, { useMemo, useState } from "react"
import { NavbarHeader } from "../NavbarHeader"
import { NavbarSearch } from "../NavbarSearch"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { LabTestTypeFilter, LabTestReportType } from "./LabTestTypeFilter"
import { useLabTestFilterStore } from "../../../../../store/LabTestFilterStore"
import { ReportListItem } from "@/services/dashboard/radiology.service"
import { useLabTestReportStore } from "../../../../../store/LabTestReportStore"
import { useRouter } from "next/navigation"

interface MobileLabTestNavbarSectionProps {
    onReportClick: (report: ReportListItem) => void
}

export function MobileLabTestNavbarSection({ onReportClick }: MobileLabTestNavbarSectionProps) {
    const { reports, setSelectedReportId, fetchReport } = useLabTestReportStore()
    const [search, setSearch] = useState("")
    const { selectedTypes, setSelectedTypes, filterReportsByType } = useLabTestFilterStore()
    const router = useRouter()

    const filteredReports = useMemo(
        () => reports.filter(report => report.name?.toLowerCase().includes(search.toLowerCase())),
        [reports, search]
    )

    const typeFilteredReports = useMemo(() => {
        console.log("Filtering lab test reports with types:", selectedTypes)
        return filterReportsByType(filteredReports)
    }, [filteredReports, selectedTypes])

    const handleReportClick = async (report: ReportListItem) => {
        setSelectedReportId(report.id!)
        await fetchReport(report.id!)
        router.push("/dashboard/lab-test")
    }

    return (
        <>
            <NavbarHeader
                label="Lab Test Reports"
                onAddNew={() => {
                    console.log("Add new lab test report")
                }}
            />

            {reports.length > 0 && (
                <div className="mt-2">
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
                {typeFilteredReports.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-gray-500">No reports found</div>
                    </div>
                ) : (
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
        </>
    )
}

export default MobileLabTestNavbarSection

import React from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { RadiologyReport } from "@/utils/types"
import { useRouter } from "next/navigation"
import { useRadiologyReportStore } from "../../../../../store/RadiologyReportStore"

interface RadiologyReportsListProps {
    reports: RadiologyReport[]
    onItemClick?: (report: RadiologyReport) => void
}

export const RadiologyReportsList: React.FC<RadiologyReportsListProps> = ({ reports, onItemClick }) => {
    const router = useRouter()

    const { setSelectedReportId, fetchReport } = useRadiologyReportStore()

    const handleReportClick = async (report: RadiologyReport) => {
        console.log("Opening radiology report:", report.id)
        setSelectedReportId(report.id)
        await fetchReport(report.id)
        router.push("/dashboard/radiology")
    }
    return (
        <div className="mt-4 text-xs overflow-y-auto overflow-x-hidden">
            {reports.map((report, index) => (
                <div
                    key={index}
                    role="button"
                    onClick={() => handleReportClick(report)}
                    className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none min-w-0">
                    <span className="truncate overflow-hidden whitespace-nowrap min-w-0 flex-1">{report.name}</span>
                    <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full flex-shrink-0">
                        <CgArrowsExpandUpRight size={23} />
                    </div>
                </div>
            ))}
        </div>
    )
}

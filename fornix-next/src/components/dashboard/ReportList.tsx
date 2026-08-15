"use client"

import React, { useEffect, useCallback, useState, useMemo, useRef } from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { MdRefresh } from "react-icons/md"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useReportStore } from "../../../store/ReportStore"
import { DashboardPath, Report as ReportHistory, UserConnectionsUser, UserConnection } from "@/utils/types"
import GenericReportResult from "./reports/ReportResult"
import { getReportById } from "@/services/dashboard/report.service"
import { parseReport } from "@/utils/dashboard/report"
import { useTabStore } from "../../../store/TabStore"
import Link from "next/link"
import { Report } from "@/utils/types"
import { getDashboardPathReportType, getPathFromReportType } from "@/utils/dashboard/helpers"
import { FaUserCircle } from "react-icons/fa"
import { IoChevronDown } from "react-icons/io5"
import { getAllConnections } from "@/services/dashboard/connections.service"
import useCloseModalOnOutsideClicked from "@/utils/hooks/useCloseModalOnOutsideClicked"

type Props = {
    onItemClick?: () => void
    selectedPatients?: UserConnectionsUser[]
}

// Export patient filter component for use in Navbar
export const PatientFilter = ({
                                  onPatientSelect,
                                  selectedPatients = []
                              }: {
    onPatientSelect: (patients: UserConnectionsUser[]) => void
    selectedPatients: UserConnectionsUser[]
}) => {
    const [showPatientDropdown, setShowPatientDropdown] = useState(false)
    const [connections, setConnections] = useState<UserConnection[]>([])
    const [loadingConnections, setLoadingConnections] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useCloseModalOnOutsideClicked(dropdownRef, () => {
        setShowPatientDropdown(false)
    })

    // Fetch connected patients
    useEffect(() => {
        const fetchConnections = async () => {
            setLoadingConnections(true)
            try {
                const data = await getAllConnections()
                setConnections(data)
            } catch (error) {
                console.error("Failed to fetch connections:", error)
            } finally {
                setLoadingConnections(false)
            }
        }
        fetchConnections()
    }, [])

    // Check if all patients are selected
    const isAllSelected = selectedPatients.length === connections.length && connections.length > 0

    // Handle select/unselect all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onPatientSelect(connections.map(conn => conn.patient))
        } else {
            onPatientSelect([])
        }
    }

    // Handle individual patient selection
    const handlePatientToggle = (patient: UserConnectionsUser, checked: boolean) => {
        if (checked) {
            // Add patient if not already selected
            if (!selectedPatients.some(p => p.id === patient.id)) {
                onPatientSelect([...selectedPatients, patient])
            }
        } else {
            // Remove patient from selection
            onPatientSelect(selectedPatients.filter(p => p.id !== patient.id))
        }
    }

    // Check if a patient is selected
    const isPatientSelected = (patientId: string | undefined) => {
        if (!patientId) return false
        return selectedPatients.some(p => p.id === patientId)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                    selectedPatients.length > 0 ? "bg-blue-100 text-blue-600" : "text-gray-600"
                }`}
                title={
                    selectedPatients.length > 0
                        ? `Filtered by: ${selectedPatients.length} patient${selectedPatients.length === 1 ? "" : "s"}`
                        : "Filter by patient"
                }>
                <FaUserCircle size={22} />
                {selectedPatients.length > 0 && (
                    <span
                        className="absolute -top-1 -right-0 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedPatients.length}
                    </span>
                )}
            </button>

            {/* Patient Dropdown */}
            {showPatientDropdown && (
                <div
                    className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto min-w-48">
                    {/* Select All Option */}
                    <div className="px-3 py-2 border-b border-gray-200">
                        <label
                            className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <span className="font-medium">All Patients</span>
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={e => {
                                    e.stopPropagation()
                                    handleSelectAll(e.target.checked)
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                onClick={e => e.stopPropagation()}
                            />
                        </label>
                    </div>

                    {/* Patient List */}
                    {loadingConnections ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading patients...</div>
                    ) : connections.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No connected patients</div>
                    ) : (
                        <div className="max-h-40 overflow-y-auto">
                            {connections.map(connection => (
                                <div key={connection.id} className="px-3 py-1">
                                    <label
                                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                                {connection.patient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{connection.patient.name}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isPatientSelected(connection.patient.id)}
                                            onChange={e => {
                                                e.stopPropagation()
                                                handlePatientToggle(connection.patient, e.target.checked)
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const ReportList = ({ onItemClick, selectedPatients = [] }: Props) => {
    const reports = useReportStore(state => state.reports)
    const isLoading = useReportStore(state => state.isLoading)
    const error = useReportStore(state => state.error)
    const selectedReportId = useReportStore(state => state.selectedReportId)

    const allReports = useReportStore(state => state.allReports)
    const filterReportsByType = useReportStore(state => state.filterReportsByType)
    const getAllReports = useReportStore(state => state.getAllReports)

    const pathName = usePathname()
    const router = useRouter()
    const { activeTab } = useTabStore()

    useEffect(() => {
        if (allReports.length === 0) return
        try {
            const segments = pathName.split("/")
            let slug = segments[segments.length - 1]
            if (slug.length > 20) {
                slug = segments[segments.length - 2]
            }
            const dashboardPath = `/${slug}` as DashboardPath
            const reportType = getDashboardPathReportType(dashboardPath)
            filterReportsByType(reportType)
        } catch (e) {
            filterReportsByType(null)
        }
    }, [pathName, allReports, filterReportsByType])

    const handleReportClick = async (reportId: string) => {
        const { setSelectedReportId, setActiveReport } = useReportStore.getState()
        try {
            setSelectedReportId(reportId)
            const reportData = await getReportById(reportId)
            const parsedData = parseReport(JSON.stringify(reportData), reportData.type) || reportData
            setActiveReport(parsedData)
            if (onItemClick) {
                onItemClick()
            }
        } catch (e) {
            console.error("Failed to fetch report:", e)
        }
    }

    // Filter reports based on selected patients using patient_id
    const filteredReports = useMemo(() => {
        let filtered = reports

        // Filter by selected patients using patient_id
        if (selectedPatients.length > 0) {
            const selectedPatientIds = selectedPatients.map(p => p.id).filter(Boolean)
            filtered = filtered.filter(report => report.patient_id && selectedPatientIds.includes(report.patient_id))
        }

        return filtered
    }, [reports, selectedPatients])

    if (isLoading) {
        // return <div className="text-center p-4 text-xs text-gray-500">Loading history...</div>
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-4 gap-2">
                <span className="text-xs text-red-500 font-medium">Failed to fetch reports</span>
                <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50 transition"
                    onClick={() => getAllReports()}>
                    <MdRefresh size={16} className="inline" />
                    <span>Try again</span>
                </button>
            </div>
        )
    }

    if (filteredReports.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4">
                {selectedPatients.length > 0 ? "No reports found for selected patients." : "No reports found."}
            </div>
        )
    }

    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {filteredReports.map((report: Report, index: number) => {
                if (!report || !report.type) return
                const destinationPath = `/dashboard/acc${getPathFromReportType(report.type)}/${report.id}`

                return (
                    <Link
                        href={destinationPath}
                        key={`${report.id}-${index}`}
                        /* onClick={() => {
                            handleReportClick(report.id)
                        }} */ //commented the onCLick out so it is not responsible for fetching data for the page it is navigating to
                        className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none">
                        <div className="truncate pr-2">{report.name}</div>
                        <div
                            className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full flex-shrink-0">
                            <CgArrowsExpandUpRight size={23} />
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}

export default ReportList

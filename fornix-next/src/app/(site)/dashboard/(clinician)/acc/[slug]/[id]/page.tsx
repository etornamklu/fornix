"use client"

import { useParams } from "next/navigation"
import { DashboardPath } from "@/utils/types"
import { useEffect, useRef } from "react"
import { useReportStore } from "../../../../../../../../store/ReportStore"

import GenericReportPage from "@/app/(site)/dashboard/(clinician)/report/page"
import HistoryTakingPage from "@/app/(site)/dashboard/(clinician)/acc/history-taking/page"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"

const pageMap: Partial<Record<DashboardPath, JSX.Element>> = {
    [DashboardPath.Examination]: <GenericReportPage />,
    [DashboardPath.ProgressNotes]: <GenericReportPage />,
    [DashboardPath.OperativeNotes]: <GenericReportPage />,
    [DashboardPath.AdmissionNotes]: <GenericReportPage />,
    [DashboardPath.DischargeSummary]: <GenericReportPage />,
    [DashboardPath.ProcedureNote]: <GenericReportPage />,
    [DashboardPath.ReferralNotes]: <GenericReportPage />,
    [DashboardPath.HistoryTaking]: <HistoryTakingPage />
}

export default function ReportByIdPage() {
    const params = useParams()
    const slug = params.slug
    const id = params.id as string

    const fetchReportById = useReportStore(state => state.fetchReportById)
    const activeReport = useReportStore(state => state.activeReport)

    const isLoading = useReportStore(state => state.isLoading)
    const individualReportError = useReportStore(state => state.individualReportError)
    const clearIndividualReportError = useReportStore(state => state.clearIndividualReportError)
    const { clearActiveReport } = useReportStore.getState()

    useEffect(() => {
        if (id) {
            fetchReportById(id)
        }

        // When the component unmounts (e.g., user navigates away), clear the active report
        return () => {
            clearActiveReport()
        }
    }, [id, fetchReportById, clearActiveReport])

    const showLoader = isLoading || (activeReport?.id !== id && !individualReportError)

    if (!slug || typeof slug !== "string") return null
    if (!id || typeof id !== "string") return null

    const slugPath = `/${slug}` as DashboardPath
    const Component = pageMap[slugPath]

    if (showLoader) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[calc(100vh-200px)]">
                <SquircleLoader size={50} speed={1.1} stroke={8} color={"#207ccd"} />
            </div>
        )
    }

    if (individualReportError) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[calc(100vh-200px)] p-4">
                <div className="text-center max-w-md">
                    <div className="text-blue-600 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
                    <p className="text-gray-600 mb-6">The report you&apos;re looking for doesn&apos;t exist</p>
                    <button
                        onClick={() => {
                            clearIndividualReportError()
                            window.location.href = "/dashboard/acc"
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Go Back Home
                    </button>
                </div>
            </div>
        )
    }

    if (!Component) return <div className="text-red-500 mt-10 text-center">Page not found</div>

    return <>{Component}</>
}

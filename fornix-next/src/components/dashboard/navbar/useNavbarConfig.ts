import { useMemo } from "react"
import { useRouter } from "next/navigation"
import useConversationPageRouteStore from "../../../../store/ConversationPageRouteStore"
import { useReportStore } from "../../../../store/ReportStore"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { DashboardPath } from "@/utils/types"
import { TAB_CONFIG } from "./tabConfig"

const ACC_REPORT_PATHS = [
    DashboardPath.HistoryTaking,
    DashboardPath.Examination,
    DashboardPath.ProgressNotes,
    DashboardPath.OperativeNotes,
    DashboardPath.AdmissionNotes,
    DashboardPath.DischargeSummary,
    DashboardPath.ProcedureNote,
    DashboardPath.ReferralNotes
]

export const useNavbarConfig = (activeTab: DashboardPath) => {
    const router = useRouter()
    const setStep = useConversationPageRouteStore((state: any) => state.setStep)
    const clearActiveReport = useReportStore((state: any) => state.clearActiveReport)

    const config = useMemo(() => {
        const baseConfig = TAB_CONFIG[activeTab]

        const onAddNew = () => {
            // Use the predefined handler from tabConfig if it exists
            if (baseConfig?.onAddNew) {
                baseConfig.onAddNew()
                window.dispatchEvent(new Event("storage")) // Ensure storage event is fired
                return
            }

            // Fallback for ACC reports that don't have a specific onAddNew in the config
            if (ACC_REPORT_PATHS.includes(activeTab)) {
                setStep(0)
                clearActiveReport()
                const url = new URL(window.location.href)
                try {
                    ;["transcriptId", "examId", "reportId"].forEach(param => {
                        if (url && url.searchParams && url.searchParams.has(param)) {
                            url.searchParams.delete(param)
                        }
                    })
                    window.history.pushState({}, "", url.toString())
                } catch (err) {
                    console.error("Failed to clean URL search params in onAddNew", err)
                }
            } else if (activeTab === DashboardPath.ImportSummary) {
                localStorage.setItem("aip_id", "")
                localStorage.removeItem("aip_id")
                localStorage.setItem("aip_t", "")
                window.dispatchEvent(new Event("storage"))
            } else {
                router.push(`/dashboard`)
            }

            window.dispatchEvent(new Event("storage"))
        }

        return {
            label: baseConfig?.label || "History",
            placeholder: baseConfig?.searchPlaceholder || "Search...",
            onAddNew
        }
    }, [activeTab, router, setStep, clearActiveReport])

    return config
}

"use client"

import { useEffect } from "react"
import RecordReport from "./RecordReport"
import ReportResult from "./ReportResult"
import useConversationPageRouteStore from "../../../../store/ConversationPageRouteStore"
import { ReportType, UserConnectionsUser } from "@/utils/types"
import { useReportStore } from "../../../../store/ReportStore"

interface Props {
    selectedPatient: UserConnectionsUser | null
    clearSelectedPatient: () => void
    openConnectionList: () => void
}

export const ReportConversation = ({ selectedPatient, openConnectionList, clearSelectedPatient }: Props) => {
    const { step, setStep } = useConversationPageRouteStore()
    const { handleReportUpdated, selectedReport } = useReportStore()

    useEffect(() => {
        setStep(0)
        clearSelectedPatient()
    }, [])

    const pages = [
        <RecordReport
            key={0}
            setStep={setStep}
            openConnectionList={openConnectionList}
            selectedPatient={selectedPatient}
            clearSelectedPatient={clearSelectedPatient}
        />,
        <ReportResult
            key={1}
            setStep={setStep}
            selectedPatient={selectedPatient}
            clearSelectedPatient={clearSelectedPatient}
            reportStore={{
                selectedReport: selectedReport,
                updateReport: handleReportUpdated,
                fetchReport: () => {}
            }}
        />
    ]

    return <div className="w-full h-full flex flex-col justify-center items-center px-1 lg:px-0">{pages[step]}</div>
}

export default ReportConversation

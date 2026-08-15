"use client"
import React, { useState, Suspense } from "react"
import ReportConversation from "@/components/dashboard/reports/ReportConversation"
import ConversationResult from "@/components/dashboard/conversation/ConversationResult"
import { useReportStore } from "../../../../../../../store/ReportStore"
import ConnectionList from "@/components/dashboard/conversation/ConnnectionList"
import { useSelectedPatientStore } from "../../../../../../../store/SelectedPatientStore"

export default function HistoryTakingPage() {
    const [openConnectionListModal, setOpenConnectionListModal] = useState(false)

    const activeReport = useReportStore(state => state.activeReport)
    const handleReportUpdated = useReportStore(state => state.handleReportUpdated)

    const { clearActiveReport } = useReportStore.getState()
    const { selectedPatient, clearSelectedPatient } = useSelectedPatientStore()

    return (
        <Suspense>
            <div className={"bg-blue w-full h-full overflow-hidden"}>
                {activeReport ? (
                    // For history taking, show the original ConversationResult, not the generic ReportResult
                    <ConversationResult reportData={activeReport} onClose={() => clearActiveReport()} />
                ) : (
                    <ReportConversation
                        selectedPatient={selectedPatient}
                        clearSelectedPatient={clearSelectedPatient}
                        openConnectionList={() => setOpenConnectionListModal(true)}
                    />
                )}
            </div>

            <ConnectionList
                isModalOn={openConnectionListModal}
                closeModal={() => setOpenConnectionListModal(false)}
                stepToNextPage={() => {}}
            />
        </Suspense>
    )
}

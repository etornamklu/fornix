"use client"
import React, { useState, Suspense } from "react"
import ReportConversation from "@/components/dashboard/reports/ReportConversation"
import GenericReportResult from "@/components/dashboard/reports/ReportResult"
import { useReportStore } from "../../../../../../store/ReportStore"
import ConnectionList from "@/components/dashboard/conversation/ConnnectionList"
import { useSelectedPatientStore } from "../../../../../../store/SelectedPatientStore"

const Report = () => {
    const [openConnectionListModal, setOpenConnectionListModal] = useState(false)

    const activeReport = useReportStore(state => state.activeReport)
    const handleReportUpdated = useReportStore(state => state.handleReportUpdated)

    const { clearActiveReport } = useReportStore.getState()
    const { selectedPatient, clearSelectedPatient } = useSelectedPatientStore()

    return (
        <Suspense>
            <div className={"bg-blue w-full h-full overflow-hidden"}>
                {activeReport ? (
                    <GenericReportResult
                        setStep={clearActiveReport}
                        selectedPatient={selectedPatient}
                        clearSelectedPatient={clearSelectedPatient}
                        reportStore={{
                            selectedReport: activeReport,
                            updateReport: handleReportUpdated,
                            fetchReport: () => {}
                        }}
                    />
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

export default Report

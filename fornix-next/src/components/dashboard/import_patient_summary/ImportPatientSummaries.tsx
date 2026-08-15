"use client"

import StartPage from "./StartPage"
import PatientSummary from "./PatientSummary"
import WaitingForConfirmation from "./WaitingForConfirmation"
import { useEffect, useState } from "react"
import { ImportedPatientData } from "@/components/dashboard/import_patient_summary/ImportedPatientData"

export const ImportPatientSummaries = () => {
    const [page, setPage] = useState(0)

    const pages = [
        <StartPage key={0} setPage={setPage} />,
        <PatientSummary key={1} setPage={setPage} />,
        <WaitingForConfirmation key={2} setPage={setPage} />,
        <ImportedPatientData key={3} setPage={setPage} />
    ]

    useEffect(() => {
        const handlePatientIDStorageChange = () => {
            const patientId = localStorage.getItem("aip_id")

            if (patientId && patientId.length) {
                setPage(3)
            }
        }

        handlePatientIDStorageChange()

        window.addEventListener("storage", handlePatientIDStorageChange)

        return () => {
            window.removeEventListener("storage", handlePatientIDStorageChange)
        }
    }, [])

    return <>{pages[page]}</>
}

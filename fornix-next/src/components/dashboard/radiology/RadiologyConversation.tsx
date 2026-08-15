import { useEffect, useState } from "react"
import RecordAnalysis from "./RadiologyAnalysis"
import RadiologyAnalysisResult from "./RadiologyAnalysisResults"
import dynamic from "next/dynamic"
import { authDefault } from "@/utils/types"

import { useSelectedPatientStore } from "../../../../store/SelectedPatientStore"
import { usePatientFormStore } from "../../../../store/patientFormStore"
import useConversationPageRouteStore from "../../../../store/ConversationPageRouteStore"
import { getReportById, ReportDetails } from "@/services/dashboard/radiology.service"
import { useRadiologyReportStore } from "../../../../store/RadiologyReportStore"
import { RadiologyReport } from "@/utils/types"

// Remove the dynamic import since you're already importing it normally above
// const RadiologyAnalysisResult = dynamic(() => import("./RadiologyAnalysisResult"), {
//     ssr: false
// })

interface RadiologistFormData {
    reportType: { value: string; label: string } | null
    uploadedFiles: File[]
    clinicalInformation: string
}

export const RadiologyConversation = () => {
    const patientNameFromForm = usePatientFormStore(state => state.name)
    const patientNameFromConnections = useSelectedPatientStore(state => state.selectedPatient?.name)

    const { step, setStep } = useConversationPageRouteStore()

    const { activeReport, selectedReportId } = useRadiologyReportStore()

    const { addOrUpdateReport } = useRadiologyReportStore()

    // State to store analysis results
    const [analysisResults, setAnalysisResults] = useState<{
        reportId: string
        content: string
        type: string
        name?: string
    } | null>(null)
    const [lastRequestData, setLastRequestData] = useState<RadiologistFormData | null>(null)

    const loadExistingReport = async (reportId: string) => {
        try {
            const report = await getReportById(reportId)
            if (report) {
                setAnalysisResults({
                    reportId: report.id,
                    content: JSON.stringify(report.content), // Convert content to string
                    type: report.type,
                    name: report.name
                })
            }
        } catch (error) {
            console.error("Failed to load report:", error)
        }
    }

    useEffect(() => {
        if (selectedReportId && activeReport) {
            console.log("Loading existing report from store:", activeReport)
            setAnalysisResults({
                reportId: activeReport.id,
                content: JSON.stringify(activeReport.content), // Convert to string like in loadExistingReport
                type: activeReport.report_type || "",
                name: activeReport.name
            })
            setStep(1) // Use number, not string
        }
    }, [selectedReportId, activeReport, setStep])

    // Handler for form submission
    const handleFormSubmit = (data: RadiologistFormData) => {
        setLastRequestData(data)
        console.log("[Radiology] submitted with:", {
            reportType: data.reportType?.value ?? null,
            files: data.uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
            clinicalInformationLength: data.clinicalInformation.length
        })
    }

    // Remove streaming retry wiring to return to prior behavior

    // Handler for when analysis is complete
    const handleAnalysisComplete = async (reportId: string, content: string, type: string) => {
        // Fetch the latest report details from the backend to get the correct name
        const reportDetails = await getReportById(reportId)
        if (reportDetails) {
            setAnalysisResults({
                reportId: reportDetails.id,
                content: JSON.stringify(reportDetails.content),
                type: reportDetails.type,
                name: reportDetails.name
            })
            const newReport: RadiologyReport = {
                id: reportDetails.id,
                name: reportDetails.name,
                created_at: reportDetails.created_at,
                patient_id: reportDetails.patient_id || undefined,
                report_type: reportDetails.type as any,
                patient_name: undefined,
                content: reportDetails.content
            }
            addOrUpdateReport(newReport)
        } else {
            // fallback to previous behavior if fetch fails
            setAnalysisResults({ reportId, content, type })
        }
        setStep(1) // Move to results page
    }

    // Handler for analysis errors
    const handleAnalysisError = (message: string) => {
        console.error("Analysis error:", message)
        // Back to form; the form shows its own user-friendly error panel
        setStep(0)
    }

    // Handler for insufficient credits
    const handleInsufficientCredits = () => {
        alert("Insufficient credits. Please upgrade your plan.")
    }

    // Handler for going back to form
    const handleBack = () => {
        setStep(0)
    }

    const pages = [
        <RecordAnalysis
            key={0}
            onSubmit={handleFormSubmit}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisError={handleAnalysisError}
            onInsufficientCredits={handleInsufficientCredits}
        />,
        <RadiologyAnalysisResult
            key={1}
            reportId={analysisResults?.reportId}
            content={analysisResults?.content}
            setStep={setStep} // ✅ Pass setStep here
            isLoadedReport={true}
            reportType={analysisResults?.type}
            createdAt={activeReport?.created_at}
            name={analysisResults?.name}
        />
    ]

    return <div className="w-full h-full flex flex-col justify-center items-center px-1 lg:px-0">{pages[step]}</div>
}

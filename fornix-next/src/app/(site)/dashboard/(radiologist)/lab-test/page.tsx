"use client"

import { useEffect, useState } from "react"
import LabTestAnalysis from "@/components/dashboard/lab-test/LabTestAnalysis"
import LabTestAnalysisResult from "@/components/dashboard/lab-test/LabTestAnalysisResults"
import { StreamLabTestAnalysis, getLabTestReportById } from "@/services/dashboard/radiology.service"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"
import { useLabTestReportStore } from "../../../../../../store/LabTestReportStore"
import { ReportListItem } from "@/services/dashboard/radiology.service"

interface LabTestFormData {
    reportType: { value: string; label: string } | null
    uploadedFiles: File[]
    clinicalInformation: string
}

interface ReportResultData {
    id: string
    name: string
    content: string
    createdAt: string
    reportType: string
}

export default function LabTestPage() {
    const [step, setStep] = useState(0)
    const [resultData, setResultData] = useState<ReportResultData | null>(null)
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastRequestData, setLastRequestData] = useState<LabTestFormData | null>(null)
    const [isViewingExisting, setIsViewingExisting] = useState(false)

    const { activeReport, selectedReportId, fetchReport } = useLabTestReportStore()

    useEffect(() => {
        if (selectedReportId && activeReport && !isStreaming) {
            console.log("Loading existing lab test report from store:", activeReport)
            setIsViewingExisting(true)
            setResultData({
                id: activeReport.id,
                name: activeReport.name,
                content: JSON.stringify(activeReport.content),
                createdAt: activeReport.created_at,
                reportType: activeReport.type
            })
            setStep(1)
        }
    }, [selectedReportId, activeReport, isStreaming])

    const summarizeRequestData = (data: LabTestFormData) => ({
        reportType: data.reportType?.value ?? null,
        files: data.uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        clinicalInformationLength: data.clinicalInformation?.length ?? 0
    })

    const startStreaming = async (data: LabTestFormData) => {
        console.log("[LabTest] startStreaming invoked with:", summarizeRequestData(data))
        if (!data.reportType || data.uploadedFiles.length === 0) {
            setError("Please select a test type and upload at least one file.")
            return
        }

        setStep(1)
        setResultData({
            id: "temp-id",
            name: "Analysing data",
            content: "",
            createdAt: new Date().toISOString(),
            reportType: data.reportType?.value || "lab_test"
        })

        setIsStreaming(true)
        setError(null)

        try {
            await StreamLabTestAnalysis(
                data.uploadedFiles,
                {
                    report_type: data.reportType.value,
                    clinical_context: data.clinicalInformation
                },

                (accumulatedText, reportId) => {
                    if (reportId) {
                        setResultData(prev => ({
                            ...prev!,
                            id: reportId,
                            content: accumulatedText
                        }))
                    } else {
                        setResultData(prev => ({
                            ...prev!,
                            content: accumulatedText
                        }))
                    }
                },

                async reportId => {
                    if (reportId) {
                        try {
                            const reportDetails = await getLabTestReportById(reportId)
                            setResultData(prev => ({
                                ...prev!,
                                name: reportDetails.name,
                                createdAt: reportDetails.created_at,
                                reportType: reportDetails.type
                            }))

                            const store = useLabTestReportStore.getState()

                            const newReport: ReportListItem = {
                                id: reportDetails.id,
                                name: reportDetails.name,
                                created_at: reportDetails.created_at,
                                updated_at: reportDetails.updated_at,
                                patient_id: reportDetails.patient_id,
                                report_type: reportDetails.type,
                                clinical_context: reportDetails.clinical_context
                            }

                            store.addOrUpdateReport(newReport)
                        } catch (err) {
                            console.error("Failed to fetch report details:", err)
                        }
                    }
                    setIsStreaming(false)
                },

                err => {
                    console.error("Error creating lab test report:", err)
                    setError("We encountered a connection issue. Please try again.")
                    setIsStreaming(false)
                }
            )
        } catch (err) {
            console.error("Error creating lab test report:", err)
            setError("We encountered a connection issue. Please try again.")
            setIsStreaming(false)
        }
    }

    const handleFormSubmit = async (data: LabTestFormData) => {
        console.log("[LabTest] submitting new analysis with:", summarizeRequestData(data))
        setLastRequestData(data)
        await startStreaming(data)
    }

    const handleBackToForm = (step?: number) => {
        setStep(0)
        setResultData(null)
        setIsViewingExisting(false)
        setError(null)

        const store = useLabTestReportStore.getState()
        store.setSelectedReportId(null)
        store.setActiveReport(null)
    }

    if (step === 0) {
        return <LabTestAnalysis onSubmit={handleFormSubmit} />
    }

    if (step === 1 && resultData) {
        return (
            <LabTestAnalysisResult
                reportId={resultData.id}
                content={resultData.content}
                setStep={handleBackToForm}
                reportType={resultData.reportType}
                createdAt={resultData.createdAt}
                name={resultData.name}
                errorMessage={error || undefined}
                onRetry={
                    lastRequestData
                        ? () => {
                              console.log(
                                  "[LabTest] retry requested with previous data:",
                                  summarizeRequestData(lastRequestData)
                              )
                              startStreaming(lastRequestData)
                          }
                        : undefined
                }
            />
        )
    }

    if (isStreaming) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <SquircleLoader size={10} speed={0.5} stroke={8} color={"blue"} />
                    <p className="mt-4 text-gray-600">Analyzing lab test results...</p>
                </div>
            </div>
        )
    }

    return null
}

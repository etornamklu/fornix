import { useState, ChangeEvent } from "react"
import { Upload, Image, FileText, AlertCircle, Send, X } from "lucide-react"
import Select, { SingleValue, StylesConfig } from "react-select"
import React, { useRef } from "react"

type ReportOption = { value: string; label: string }

interface RadiologistFormData {
    reportType: SingleValue<ReportOption>
    uploadedFiles: File[]
    clinicalInformation: string
}

interface RadiologistFormProps {
    onSubmit: (data: RadiologistFormData) => void
    onAnalysisComplete?: (reportId: string, content: string, type: string) => void
    onAnalysisError?: (error: string) => void
    onInsufficientCredits?: () => void
    onBack?: () => void
}

export default function RadiologyAnalysis({
    onSubmit,
    onAnalysisComplete,
    onAnalysisError,
    onInsufficientCredits,
    onBack
}: RadiologistFormProps) {
    const [reportType, setReportType] = useState<SingleValue<ReportOption>>(null)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [clinicalInformation, setClinicalInformation] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const MAX_CLINICAL_INFO_LENGTH = 4000

    const reportTypeOptions: ReportOption[] = [
        { value: "xray", label: "X-Ray" },
        // { value: "ct_scan", label: "CT Scan" }, // Temporarily disabled - not available yet
        { value: "ecg", label: "ECG" },
        { value: "ultrasound", label: "Ultrasound" }
    ]

    const customStyles: StylesConfig<ReportOption, false> = {
        control: base => ({
            ...base,
            minHeight: "40px",
            borderRadius: "8px",
            opacity: isSubmitting ? 0.5 : 1
        }),
        indicatorSeparator: () => ({ display: "none" })
    }

    const handleFiles = (files: File[]) => {
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
        const filtered = files.filter(file => validTypes.includes(file.type))
        setUploadedFiles(filtered)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files))
        }
    }

    const onButtonClick = () => {
        const input = document.getElementById("fileInput") as HTMLInputElement
        input?.click()
    }

    const summarizeRequestData = () => ({
        reportType: reportType?.value ?? null,
        files: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        clinicalInformationLength: clinicalInformation.length
    })

    const handleSubmit = async () => {
        if (!reportType || uploadedFiles.length === 0) {
            alert("Please select a report type and upload at least one file.")
            return
        }

        setIsSubmitting(true)
        setSubmitError(null)
        console.log("[Radiology] submitting analysis with:", summarizeRequestData())

        // Minimal fix: notify parent immediately so it can persist last request for retry
        onSubmit({ reportType, uploadedFiles, clinicalInformation })

        try {
            const { StreamRadiologyAnalysis, storeRadiologyReport } = await import(
                "@/services/dashboard/radiology.service"
            )

            const metadata = {
                clinical_context: clinicalInformation,
                report_type: reportType.value as "xray" | "ct_scan" | "ecg" | "ultrasound",
                patient_age: null,
                patient_gender: null,
                patient_age_unit: null
            }

            let reportId = ""
            let analysisContent = ""

            await StreamRadiologyAnalysis(
                uploadedFiles,
                metadata,
                (partialText: string, id?: string) => {
                    if (id) {
                        reportId = id
                    }
                    analysisContent = partialText
                },
                (id?: string) => {
                    if (id) {
                        reportId = id
                    }
                    // Store the report and call callbacks on completion
                    storeRadiologyReport(reportId, analysisContent)
                    onSubmit({ reportType, uploadedFiles, clinicalInformation })
                    onAnalysisComplete?.(reportId, analysisContent, reportType.value)
                },
                () => {
                    console.error("[Radiology] analysis failed for:", summarizeRequestData())
                    setSubmitError("We couldn't complete the analysis due to a connection issue. Please try again.")
                    onAnalysisError?.("We couldn't complete the analysis due to a connection issue. Please try again.")
                },
                () => {
                    onInsufficientCredits?.()
                }
            )
        } catch (err) {
            console.error(err)
            setSubmitError("Unexpected error occurred. Please try again.")
            onAnalysisError?.("Unexpected error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeFile = (index: number) => {
        setUploadedFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index)
            if (newFiles.length === 0 && fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            return newFiles
        })
    }

    return (
        <div className="w-full h-full max-w-4xl mx-auto py-6 overflow-y-auto overflow-x-hidden">
            <h2 className="text-3xl font-bold text-center mb-4">Radiology Analysis</h2>

            <div className="grid gap-6">
                {/* Report Type */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-base font-semibold mb-2">Report Type</h3>
                    <Select<ReportOption>
                        options={reportTypeOptions}
                        value={reportType}
                        onChange={option => setReportType(option)}
                        styles={customStyles}
                        isDisabled={isSubmitting}
                        placeholder="Select report type"
                    />
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-base font-semibold mb-3">Upload Images</h3>

                    <div
                        className="relative border-2 border-dashed border-blue-300 rounded p-6 text-center hover:border-blue-400 transition"
                        onClick={onButtonClick}>
                        <input
                            id="fileInput"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleChange}
                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                            disabled={isSubmitting}
                        />
                        <div className="flex flex-col items-center space-y-2">
                            <Image className="w-6 h-6 text-blue-500" />
                            <p className="text-sm text-gray-600">Click or drop files here to upload.</p>
                            <p className="text-xs text-gray-400">
                                PNG, JPG, JPEG, WEBP, or PDF. Multiple files supported.
                            </p>
                        </div>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 max-h-64 overflow-y-auto overflow-x-hidden space-y-2">
                            {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                                    <div className="flex items-center gap-2 text-sm text-gray-800 flex-1 min-w-0">
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate max-w-[200px] sm:max-w-[300px]">{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        disabled={isSubmitting}
                                        className="flex-shrink-0 ml-2">
                                        <X className="w-4 h-4 text-red-500 hover:text-red-700" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-2 flex items-start gap-2 bg-yellow-50 border border-yellow-200 p-2 rounded-md text-yellow-800 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <span>You can upload multiple images for a more complete analysis.</span>
                    </div>
                </div>

                {/* Clinical Info */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-base font-semibold mb-2">Clinical Information</h3>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded resize-none min-h-[100px] text-sm outline-none"
                        placeholder="Provide patient symptoms, history, or notes for the radiologist..."
                        value={clinicalInformation}
                        onChange={e => {
                            if (e.target.value.length <= MAX_CLINICAL_INFO_LENGTH) {
                                setClinicalInformation(e.target.value)
                            }
                        }}
                        disabled={isSubmitting}
                        maxLength={MAX_CLINICAL_INFO_LENGTH}
                    />
                    <div className="mt-2 text-xs text-gray-500 text-right">
                        {clinicalInformation.length} / {MAX_CLINICAL_INFO_LENGTH} characters
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reportType || uploadedFiles.length === 0}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
                        isSubmitting || !reportType || uploadedFiles.length === 0
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}>
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Get Analysis
                        </>
                    )}
                </button>

                {submitError && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
                        <div className="bg-white rounded-xl w-full max-w-md mx-auto shadow-lg">
                            <div className="p-4 sm:p-6 text-center">
                                <p className="text-red-600 font-semibold mb-2">We couldn’t complete the analysis.</p>
                                <p className="mb-4 text-sm sm:text-base text-gray-700">{submitError}</p>
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            console.log("[Radiology] retry requested with:", summarizeRequestData())
                                            handleSubmit()
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                        Try again
                                    </button>
                                    <button
                                        onClick={() => setSubmitError(null)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

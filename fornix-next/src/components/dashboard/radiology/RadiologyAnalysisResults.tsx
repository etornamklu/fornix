import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
    FileText,
    Download,
    RefreshCw,
    ArrowLeft,
    Calendar,
    AlertCircle,
    CheckCircle,
    Copy,
    Loader2,
    Activity,
    Heart,
    Clock,
    Zap
} from "lucide-react"
import { FaCheck, FaCheckCircle } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"
import { CiCircleAlert } from "react-icons/ci"
import { FiCopy } from "react-icons/fi"
import { LuLoaderCircle } from "react-icons/lu"
import { AiOutlineEdit } from "react-icons/ai"
import { CgClose } from "react-icons/cg"
import { updateReport } from "@/services/dashboard/radiology.service"
import { useRadiologyReportStore } from "../../../../store/RadiologyReportStore"

import {
    RadiologyReportData,
    ParsedRadiologyData,
    ECGReport,
    XRayReport,
    CTScanReport,
    UltrasoundReport,
    RadiologyReportContent,
    RadiologyReportType
} from "@/utils/types"

// Mock function to simulate clearing data
const clearRadiologyReportData = () => {
    // localStorage.removeItem("radiology_report")
}

interface RadiologyAnalysisResultProps {
    reportId?: string
    content?: string
    setStep: (step: number) => void
    reportType?: string
    isLoadedReport?: boolean
    createdAt?: string
    name?: string
}

type LoadingPhase = "analyzing" | "processing" | "generating" | "complete"

const PHASE_LABELS: Record<LoadingPhase, string> = {
    analyzing: "Analyzing images",
    processing: "Processing data",
    generating: "Generating report",
    complete: "Complete"
}

export default function RadiologyAnalysisResult({
    reportId,
    content,
    setStep,
    reportType,
    isLoadedReport = false,
    createdAt,
    name
}: RadiologyAnalysisResultProps) {
    const [reportData, setReportData] = useState<RadiologyReportData | null>(null)
    const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null)
    const [localError, setLocalError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const [isEditingName, setIsEditingName] = useState(false)
    const [editableName, setEditableName] = useState("")

    // Streaming content states
    const [streamingContent, setStreamingContent] = useState<string>("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [parsedStreamingData, setParsedStreamingData] = useState<ParsedRadiologyData | null>(null)

    const contentRef = useRef<HTMLDivElement>(null)

    const currentSetStep = setStep || (() => {})
    const addOrUpdateReport = useRadiologyReportStore(state => state.addOrUpdateReport)

    // Helper function to parse JSON content
    const parseJsonContent = (jsonString: string): ParsedRadiologyData | null => {
        try {
            return JSON.parse(jsonString)
        } catch (error) {
            console.error("Error parsing JSON content:", error)
            return null
        }
    }
    // No error overlay here; error handling occurs in the form/parent

    // Type guard to check if data is ECG report
    const isECGReport = (data: any): data is ECGReport => {
        return data && data.measurements && typeof data.measurements === "object"
    }

    // Type guard to check if data is X-Ray report
    const isXRayReport = (data: any): data is XRayReport => {
        return data && data.anatomic_region && data.findings && data.findings.skeletal
    }

    // Type guard to check if data is CT Scan report
    const isCTScanReport = (data: any): data is CTScanReport => {
        return data && data.scan_type && data.abnormalities
    }

    // Type guard to check if data is Ultrasound report
    const isUltrasoundReport = (data: any): data is UltrasoundReport => {
        return data && data.modality && data.findings && data.findings.positive_findings
    }

    // Helper function to safely convert values to string, handling objects properly
    const safeValueToString = (value: any): string => {
        if (value === null || value === undefined) {
            return "N/A"
        }
        if (typeof value === "string") {
            return value
        }
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value)
        }
        if (Array.isArray(value)) {
            return value.map(item => safeValueToString(item)).join(", ")
        }
        if (typeof value === "object") {
            // Handle nested objects by formatting them as key-value pairs
            return Object.entries(value)
                .filter(([_, val]) => val !== null && val !== undefined)
                .map(([key, val]) => `${key.replace(/_/g, " ")}: ${safeValueToString(val)}`)
                .join("; ")
        }
        return String(value)
    }

    // Helper function to format nested object entries
    const formatNestedObject = (obj: any, indentLevel: number = 0): string => {
        if (!obj || typeof obj !== "object") {
            return safeValueToString(obj)
        }

        const indent = "  ".repeat(indentLevel)
        let result = ""

        Object.entries(obj).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                const formattedKey = key.replace(/_/g, " ").toUpperCase()

                if (typeof value === "object" && !Array.isArray(value)) {
                    result += `${indent}${formattedKey}:\n`
                    result += formatNestedObject(value, indentLevel + 1)
                } else {
                    result += `${indent}${formattedKey}: ${safeValueToString(value)}\n`
                }
            }
        })

        return result
    }

    // Updated formatContentForDisplay function
    const formatContentForDisplay = (data: ParsedRadiologyData, reportType?: string): string => {
        let formatted = `${reportType?.toUpperCase() || "RADIOLOGY"} REPORT\n\n`

        // Handle ECG Reports
        if (reportType === "ecg" || isECGReport(data)) {
            const ecgData = data as ECGReport

            if (ecgData.measurements) {
                formatted += "MEASUREMENTS:\n"
                Object.entries(ecgData.measurements).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formatted += `  ${key.replace(/_/g, " ").toUpperCase()}: ${safeValueToString(value)}\n`
                    }
                })
                formatted += "\n"
            }

            if (ecgData.findings?.rhythm) {
                formatted += `RHYTHM: ${safeValueToString(ecgData.findings.rhythm)}\n\n`
            }

            if (ecgData.findings?.positive_findings?.length) {
                formatted += "POSITIVE FINDINGS:\n"
                ecgData.findings.positive_findings.forEach((finding: string) => {
                    formatted += `• ${safeValueToString(finding)}\n`
                })
                formatted += "\n"
            }

            if (ecgData.findings?.negative_findings?.length) {
                formatted += "NEGATIVE FINDINGS:\n"
                ecgData.findings.negative_findings.forEach((finding: string) => {
                    formatted += `• ${safeValueToString(finding)}\n`
                })
                formatted += "\n"
            }
        }

        // Handle X-ray Reports
        else if (reportType === "xray" || isXRayReport(data)) {
            const xrayData = data as XRayReport

            if (xrayData.anatomic_region) {
                formatted += `ANATOMIC REGION: ${safeValueToString(xrayData.anatomic_region)}\n\n`
            }

            if (xrayData.projection) {
                formatted += `PROJECTION: ${safeValueToString(xrayData.projection)}\n\n`
            }

            if (xrayData.image_quality) {
                formatted += "IMAGE QUALITY:\n"
                formatted += formatNestedObject(xrayData.image_quality, 1)
                formatted += "\n"
            }

            if (xrayData.findings) {
                formatted += "FINDINGS:\n"

                // Skeletal findings
                if (xrayData.findings.skeletal) {
                    formatted += "  SKELETAL:\n"
                    formatted += formatNestedObject(xrayData.findings.skeletal, 2)
                }

                // Soft tissues
                if (xrayData.findings.soft_tissues) {
                    formatted += "  SOFT TISSUES:\n"
                    formatted += formatNestedObject(xrayData.findings.soft_tissues, 2)
                }

                // Joint spaces
                if (xrayData.findings.joint_spaces) {
                    formatted += "  JOINT SPACES:\n"
                    formatted += formatNestedObject(xrayData.findings.joint_spaces, 2)
                }

                // Organ specific
                if (xrayData.findings.organ_specific) {
                    formatted += "  ORGAN SPECIFIC FINDINGS:\n"
                    Object.entries(xrayData.findings.organ_specific).forEach(([organ, findings]) => {
                        if (findings) {
                            formatted += `    ${organ.toUpperCase()}:\n`
                            formatted += formatNestedObject(findings, 3)
                        }
                    })
                }
                formatted += "\n"
            }

            if (xrayData.impression) {
                if (typeof xrayData.impression === "object") {
                    formatted += "IMPRESSION:\n"
                    if (xrayData.impression.detailed_summary) {
                        formatted += `  DETAILED SUMMARY: ${safeValueToString(xrayData.impression.detailed_summary)}\n`
                    }
                    if (xrayData.impression.differential_diagnosis?.length) {
                        formatted += "  DIFFERENTIAL DIAGNOSIS:\n"
                        xrayData.impression.differential_diagnosis.forEach((diagnosis: string) => {
                            formatted += `    • ${safeValueToString(diagnosis)}\n`
                        })
                    }
                    if (xrayData.impression.urgency) {
                        formatted += `  URGENCY: ${safeValueToString(xrayData.impression.urgency)}\n`
                    }
                } else {
                    formatted += `IMPRESSION: ${safeValueToString(xrayData.impression)}\n`
                }
                formatted += "\n"
            }
        }

        // Handle CT Scan Reports
        else if (reportType === "ct_scan" || isCTScanReport(data)) {
            const ctData = data as CTScanReport

            if (ctData.scan_type) {
                formatted += `SCAN TYPE: ${safeValueToString(ctData.scan_type)}\n\n`
            }

            if (ctData.abnormalities?.length) {
                formatted += "ABNORMALITIES:\n"
                ctData.abnormalities.forEach((abnormality, index) => {
                    formatted += `  ${index + 1}.\n`
                    if (abnormality.region) formatted += `    Region: ${safeValueToString(abnormality.region)}\n`
                    if (abnormality.finding) formatted += `    Finding: ${safeValueToString(abnormality.finding)}\n`
                    if (abnormality.significance)
                        formatted += `    Significance: ${safeValueToString(abnormality.significance)}\n`
                    formatted += "\n"
                })
            }

            if (ctData.findings) {
                formatted += "FINDINGS:\n"
                if (ctData.findings.detailed_findings) {
                    formatted += `  DETAILED FINDINGS: ${safeValueToString(ctData.findings.detailed_findings)}\n\n`
                }

                if (ctData.findings.positive_findings?.length) {
                    formatted += "  POSITIVE FINDINGS:\n"
                    ctData.findings.positive_findings.forEach((finding: string) => {
                        formatted += `    • ${safeValueToString(finding)}\n`
                    })
                }

                if (ctData.findings.negative_findings?.length) {
                    formatted += "  NEGATIVE FINDINGS:\n"
                    ctData.findings.negative_findings.forEach((finding: string) => {
                        formatted += `    • ${safeValueToString(finding)}\n`
                    })
                }
                formatted += "\n"
            }

            if (ctData.impression) {
                formatted += `IMPRESSION: ${safeValueToString(ctData.impression)}\n\n`
            }
        }

        // Handle Ultrasound Reports
        else if (reportType === "ultrasound" || isUltrasoundReport(data)) {
            const usData = data as UltrasoundReport

            if (usData.anatomic_region) {
                formatted += `ANATOMIC REGION: ${safeValueToString(usData.anatomic_region)}\n\n`
            }

            if (usData.modality) {
                formatted += `MODALITY: ${safeValueToString(usData.modality)}\n\n`
            }

            if (usData.image_quality) {
                formatted += "IMAGE QUALITY:\n"
                formatted += formatNestedObject(usData.image_quality, 1)
                formatted += "\n"
            }

            if (usData.findings) {
                formatted += "FINDINGS:\n"

                if (usData.findings.positive_findings?.length) {
                    formatted += "  POSITIVE FINDINGS:\n"
                    usData.findings.positive_findings.forEach((finding, index) => {
                        formatted += `    ${index + 1}.\n`
                        if (finding.organ) formatted += `      Organ: ${safeValueToString(finding.organ)}\n`
                        if (finding.description)
                            formatted += `      Description: ${safeValueToString(finding.description)}\n`
                        if (finding.measurements?.length) {
                            formatted += `      Measurements: ${finding.measurements.map(m => safeValueToString(m)).join(", ")}\n`
                        }
                        if (finding.vascularity)
                            formatted += `      Vascularity: ${safeValueToString(finding.vascularity)}\n`
                        if (finding.echogenicity)
                            formatted += `      Echogenicity: ${safeValueToString(finding.echogenicity)}\n`
                    })
                    formatted += "\n"
                }

                if (usData.findings.negative_findings?.length) {
                    formatted += "  NEGATIVE FINDINGS:\n"
                    usData.findings.negative_findings.forEach((finding: string) => {
                        formatted += `    • ${safeValueToString(finding)}\n`
                    })
                    formatted += "\n"
                }

                if (usData.findings.free_fluid) {
                    formatted += `  FREE FLUID: ${safeValueToString(usData.findings.free_fluid)}\n`
                }

                if (usData.findings.masses) {
                    formatted += `  MASSES: ${safeValueToString(usData.findings.masses)}\n`
                }

                if (usData.findings.other_findings) {
                    formatted += `  OTHER FINDINGS: ${safeValueToString(usData.findings.other_findings)}\n`
                }
                formatted += "\n"
            }

            if (usData.impression) {
                formatted += "IMPRESSION:\n"
                if (typeof usData.impression === "object") {
                    if (usData.impression.detailed_summary) {
                        formatted += `  DETAILED SUMMARY: ${safeValueToString(usData.impression.detailed_summary)}\n`
                    }
                    if (usData.impression.recommendations) {
                        formatted += `  RECOMMENDATIONS: ${safeValueToString(usData.impression.recommendations)}\n`
                    }
                } else {
                    formatted += `  ${safeValueToString(usData.impression)}\n`
                }
                formatted += "\n"
            }
        }

        // Common fields for all report types
        if (data.detailed_findings) {
            formatted += `DETAILED FINDINGS:\n${safeValueToString(data.detailed_findings)}\n\n`
        }

        if (data.diagnosis) {
            formatted += `DIAGNOSIS:\n${safeValueToString(data.diagnosis)}\n\n`
        }

        if (data.clinical_correlation) {
            formatted += `CLINICAL CORRELATION:\n${safeValueToString(data.clinical_correlation)}\n\n`
        }

        if (data.clinical_management) {
            formatted += `CLINICAL MANAGEMENT:\n${safeValueToString(data.clinical_management)}\n\n`
        }

        return formatted
    }

    // Simulate streaming data during generation
    const simulateStreamingGeneration = async (providedContent?: string) => {
        setIsStreaming(true)
        setStreamingContent("")
        setParsedStreamingData(null)

        // If content is provided, use it directly
        if (providedContent) {
            setStreamingContent(providedContent)

            // Try to parse as JSON for structured display
            const parsed = parseJsonContent(providedContent)
            if (parsed) {
                setParsedStreamingData(parsed)
            }

            // Create final report data
            const finalReportData: RadiologyReportData = {
                report_id: reportId || `RAD-${Date.now()}`,
                content: parsed || providedContent,
                timestamp: new Date().toISOString(),
                name: `${reportType?.toUpperCase()} Report ${new Date().toLocaleDateString()}`,
                report_type: reportType
            }

            setReportData(finalReportData)
            setEditableName(
                finalReportData.name || `${reportType?.toUpperCase()} Report ${new Date().toLocaleDateString()}`
            )
            setIsStreaming(false)
            setStreamingContent("")
            setParsedStreamingData(null)
            setLoadingPhase("complete")
            return
        }

        // Fallback simulation for testing
        const sampleJsonData: ECGReport = {
            measurements: {
                heart_rate: "75 bpm",
                pr_interval: "160 ms",
                qrs_duration: "100 ms",
                qt_interval: "400 ms",
                corrected_qt: "420 ms",
                axis: "Normal"
            },
            findings: {
                rhythm: "Sinus rhythm with occasional premature ventricular contractions (PVCs)",
                positive_findings: [
                    "Sinus rhythm",
                    "Occasional PVCs with a wide QRS complex",
                    "Normal QT interval",
                    "Normal heart rate"
                ],
                negative_findings: [
                    "No ST elevation",
                    "No signs of ischemia or infarction",
                    "No left ventricular hypertrophy"
                ]
            },
            detailed_findings:
                "The ECG demonstrates a regular sinus rhythm at a heart rate of 75 bpm. The PR interval is within normal limits at 160 ms, indicating normal atrioventricular conduction.",
            diagnosis: "Sinus rhythm with occasional premature ventricular contractions (PVCs)",
            clinical_correlation:
                "The patient is a 25-year-old pregnant woman presenting with an irregular heartbeat, which correlates with the observed PVCs on the ECG.",
            clinical_management:
                "Consider outpatient follow-up with a cardiologist for further evaluation of PVCs, and possibly a Holter monitor to assess the frequency and characteristics of the PVCs."
        }

        const jsonString = JSON.stringify(sampleJsonData, null, 2)

        // Simulate streaming by adding characters progressively
        for (let i = 0; i < jsonString.length; i++) {
            const currentText = jsonString.substring(0, i + 1)
            setStreamingContent(currentText)

            // Try to parse partial JSON for real-time structured display
            try {
                const parsed = JSON.parse(currentText)
                setParsedStreamingData(parsed)
            } catch (error) {
                // Ignore parsing errors for partial JSON
            }

            await new Promise(resolve => setTimeout(resolve, 20))
        }

        // After streaming is complete, set the final report data
        const finalReportData: RadiologyReportData = {
            report_id: reportId || `RAD-${Date.now()}`,
            content: sampleJsonData,
            timestamp: new Date().toISOString(),
            name: `${reportType?.toUpperCase()} Report ${new Date().toLocaleDateString()}`,
            report_type: reportType
        }

        setReportData(finalReportData)
        setEditableName(
            finalReportData.name || `${reportType?.toUpperCase()} Report ${new Date().toLocaleDateString()}`
        )
        setIsStreaming(false)
        setStreamingContent("")
        setParsedStreamingData(null)
        setLoadingPhase("complete")
    }

    // Rest of component implementation remains the same...
    // (including useEffect, event handlers, and render methods)

    useEffect(() => {
        const initializeData = async () => {
            if (isLoadedReport && reportId && content) {
                const parsed = parseJsonContent(content)
                const finalReportData = {
                    report_id: reportId,
                    content: parsed || content,
                    timestamp: createdAt || new Date().toISOString(),
                    name: name || `${reportType?.toUpperCase()} Report ${new Date().toLocaleDateString()}`,
                    report_type: reportType
                }
                setReportData(finalReportData)
                setEditableName(finalReportData.name)
                setLoadingPhase("complete")
                return
            }
            if (reportId && content) {
                // Simulate loading phases for immediate data
                setLoadingPhase("analyzing")
                await new Promise(resolve => setTimeout(resolve, 800))

                setLoadingPhase("processing")
                await new Promise(resolve => setTimeout(resolve, 600))

                setLoadingPhase("generating")
                await simulateStreamingGeneration(content)
                return
            }
        }

        initializeData()
    }, [reportId, content, reportType, isLoadedReport, createdAt, name])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const handleNewAnalysis = () => {
        clearRadiologyReportData()
        currentSetStep(0)
    }

    const handleClose = () => {
        // Clear the radiology report store when explicitly closing the report
        const { clearReport } = useRadiologyReportStore.getState()
        clearReport()
        currentSetStep(0)
    }

    const saveName = async () => {
        if (reportData && editableName !== reportData.name) {
            try {
                await updateReport(reportData.report_id, { name: editableName })
                const updatedData = { ...reportData, name: editableName }
                setReportData(updatedData)
                addOrUpdateReport({
                    id: updatedData.report_id,
                    name: updatedData.name,
                    created_at: updatedData.timestamp,
                    report_type: updatedData.report_type,
                    patient_id: undefined, // not available in this context
                    content:
                        typeof updatedData.content === "object" && updatedData.content !== null
                            ? updatedData.content
                            : undefined
                })
            } catch (error) {
                // Optionally, show an error message (not required by user)
            }
        }
        setIsEditingName(false)
    }

    const getPhaseIcon = (phase: LoadingPhase) => {
        if (localError) return <CiCircleAlert className="w-5 h-5 text-red-600" />

        const phaseOrder: LoadingPhase[] = ["analyzing", "processing", "generating", "complete"]
        const currentPhaseIndex = loadingPhase ? phaseOrder.indexOf(loadingPhase) : -1
        const thisPhaseIndex = phaseOrder.indexOf(phase)

        if (loadingPhase === phase) {
            return <LuLoaderCircle className="w-5 h-5 animate-spin text-blue-600" />
        }

        if (currentPhaseIndex > thisPhaseIndex) {
            return <FaCheckCircle className="w-5 h-5 text-green-600" />
        }

        if (phase === "complete" && loadingPhase === "complete") {
            return <FaCheckCircle className="w-5 h-5 text-green-600" />
        }

        return <div className="w-5 h-5" />
    }

    // Updated renderEssayFormat function
    const renderEssayFormat = (data: ParsedRadiologyData) => {
        const essayContent = formatContentForDisplay(data, reportType)
        return (
            <div className="w-full">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6">
                        <div className="prose prose-slate max-w-none">
                            <div className="font-sans text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                                {essayContent}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Updated handleCopyReport function
    const handleCopyReport = async () => {
        if (reportData?.content) {
            try {
                const textContent =
                    typeof reportData.content === "string"
                        ? reportData.content
                        : formatContentForDisplay(reportData.content, reportType)
                await navigator.clipboard.writeText(textContent)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (error) {
                console.error("Failed to copy report:", error)
            }
        }
    }

    // Updated handleDownloadReport function
    const handleDownloadReport = () => {
        if (reportData?.content) {
            const textContent =
                typeof reportData.content === "string"
                    ? reportData.content
                    : formatContentForDisplay(reportData.content, reportType)
            const blob = new Blob([textContent], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${editableName.replace(/\s+/g, "_")}_${reportData.report_id}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    }

    const renderStreamingContent = () => {
        if (parsedStreamingData) {
            return (
                <div className="space-y-4">
                    <div className="border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-700">
                            <LuLoaderCircle className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Parsing structured data...</span>
                        </div>
                    </div>
                    {renderEssayFormat(parsedStreamingData)}
                </div>
            )
        }

        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <LuLoaderCircle className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Streaming analysis results...</span>
                </div>
                <div className="font-sans text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {streamingContent}
                    <span className="animate-pulse text-blue-500">|</span>
                </div>
            </div>
        )
    }

    const ErrorModal = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 text-center">
                    <CiCircleAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Error</h3>
                    <p className="mb-4 text-sm sm:text-base text-gray-600">{localError}</p>
                    <button
                        onClick={() => {
                            setLocalError(null)
                            handleClose()
                        }}
                        className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Back
                    </button>
                </div>
            </div>
        </div>
    )

    const LoadingModal = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Processing Radiology Analysis</h3>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Please wait while we analyze your medical images
                        </p>
                    </div>
                    <div className="space-y-4">
                        {(Object.keys(PHASE_LABELS) as LoadingPhase[])
                            .filter(ph => ph !== "complete")
                            .map(ph => (
                                <div key={ph} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                    <div className="flex-shrink-0">{getPhaseIcon(ph)}</div>
                                    <div className="flex-1">
                                        <span className="text-sm sm:text-base font-medium">{PHASE_LABELS[ph]}</span>
                                        {loadingPhase === ph && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {ph === "analyzing" && "Analyzing medical images..."}
                                                {ph === "processing" && "Processing image data..."}
                                                {ph === "generating" && "Creating analysis report..."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-gray-50 rounded-xl flex flex-col relative overflow-x-hidden p-4 sm:p-6">
            {localError && <ErrorModal />}
            {(loadingPhase === "analyzing" || loadingPhase === "processing") && <LoadingModal />}

            {/* Streaming content display during generation */}
            {loadingPhase === "generating" && isStreaming && (
                <div className="flex flex-col h-full">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div className="flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">
                                Generating {reportType?.toUpperCase()} Analysis
                            </h2>
                            <div className="flex items-center gap-2 text-blue-600">
                                <LuLoaderCircle className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Analysis generation in progress...</span>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="self-start px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                            Cancel
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">{renderStreamingContent()}</div>
                </div>
            )}

            {/* Final essay format report display */}
            {loadingPhase === "complete" && reportData && !isStreaming && (
                <div className="flex flex-col h-full" ref={contentRef}>
                    <div className="flex justify-between items-center gap-4 mb-4 sm:mb-6 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                                Close
                            </button>
                            <button
                                onClick={handleNewAnalysis}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base flex items-center gap-2">
                                New
                                <FaPlus />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyReport}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                    copied ? "bg-green-100 text-green-600" : "hover:bg-gray-100"
                                }`}>
                                {copied ? (
                                    <>
                                        <FaCheck size={16} />
                                        <span className="text-sm">Copied</span>
                                    </>
                                ) : (
                                    <FiCopy className="hover:text-blue-600" />
                                )}
                            </button>
                            <button
                                onClick={handleDownloadReport}
                                className="p-2 rounded-lg transition-colors hover:bg-gray-100">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                        {!isEditingName ? (
                            <>
                                <h2 className="text-xl sm:text-2xl font-bold flex-1 truncate overflow-hidden whitespace-nowrap min-w-0">
                                    {editableName}
                                </h2>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                                    <AiOutlineEdit size={20} />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <input
                                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                    value={editableName}
                                    onChange={e => setEditableName(e.target.value)}
                                />
                                <button
                                    onClick={saveName}
                                    className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                                    <FaCheck size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingName(false)
                                        setEditableName(
                                            reportData.name ||
                                                `${reportType?.toUpperCase()} Report ${new Date().toLocaleDateString()}`
                                        )
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                                    <CgClose size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Report metadata */}
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="inline-flex items-center min-w-0">
                                    <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">ID: {reportData.report_id}</span>
                                </span>
                            </div>
                            <div className="flex gap-4 mt-2 sm:mt-0">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(reportData.timestamp)}</span>
                                </div>
                                {reportData.report_type && (
                                    <div className="flex items-center gap-1">
                                        <Activity className="w-4 h-4" />
                                        <span>{reportData.report_type.toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Render the final essay format data */}
                    <div className="flex-grow overflow-y-auto">
                        {typeof reportData.content === "string" ? (
                            <div className="w-full">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="p-6">
                                        <div className="prose prose-slate max-w-none">
                                            <div className="font-sans text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                                                {reportData.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            renderEssayFormat(reportData.content)
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

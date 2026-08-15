import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileText, Download, Calendar, Activity, Copy, Flag } from "lucide-react"
import { FaCheck } from "react-icons/fa"
import { FiCopy } from "react-icons/fi"
import { AiOutlineEdit } from "react-icons/ai"
import { CgClose } from "react-icons/cg"
import { FaPlus } from "react-icons/fa6"
import { GeneralLabTestReport } from "@/utils/types"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"
import { updateLabTestReport } from "@/services/dashboard/radiology.service"
import { useLabTestReportStore } from "../../../../store/LabTestReportStore"
import LoadingDiagnosis from "../patient_diagnosis/generate_diagnosis/LoadingDiagnosis"

interface LabTestAnalysisResultProps {
    reportId?: string
    content?: string
    setStep: (step: number) => void
    reportType?: string
    isLoadedReport?: boolean
    createdAt?: string
    name?: string
    errorMessage?: string
    onRetry?: () => void
}

export default function LabTestAnalysisResult({
    reportId,
    content,
    setStep,
    reportType,
    isLoadedReport = false,
    createdAt,
    name,
    errorMessage,
    onRetry
}: LabTestAnalysisResultProps) {
    const [reportData, setReportData] = useState<GeneralLabTestReport | null>(null)
    const [copied, setCopied] = useState(false)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editableName, setEditableName] = useState(name || "Lab Test Report")
    const addOrUpdateReport = useLabTestReportStore(state => state.addOrUpdateReport)

    useEffect(() => {
        if (name) {
            setEditableName(name)
        }
    }, [name])

    useEffect(() => {
        if (content) {
            try {
                const parsedContent = JSON.parse(content)
                setReportData(parsedContent)
            } catch (error) {
                setReportData(null)
            }
        }
    }, [content])

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
        setStep(0)
    }

    const handleClose = () => {
        setStep(0)
    }

    // Minimal helpers for formatting and empty display
    const formatEnumLabel = (value?: string): string => {
        if (value == null) return "N/A"
        const trimmed = String(value).trim()
        if (trimmed === "" || trimmed === ".") return "N/A"
        return trimmed
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase())
    }

    const displayOrNA = (value: any): string => {
        if (value == null) return "N/A"
        if (typeof value === "string") {
            const v = value.trim()
            return v === "" || v === "." ? "N/A" : v
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return "N/A"
            const joined = value
                .map(v => displayOrNA(v))
                .filter(v => v !== "N/A")
                .join(", ")
            return joined || "N/A"
        }
        return String(value)
    }

    const handleSaveName = async () => {
        if (!reportId) return

        try {
            const updatedReport = await updateLabTestReport(reportId, { name: editableName })
            addOrUpdateReport({
                id: updatedReport.id,
                name: updatedReport.name,
                created_at: updatedReport.created_at,
                updated_at: updatedReport.updated_at,
                patient_id: updatedReport.patient_id,
                report_type: updatedReport.type,
                clinical_context: updatedReport.clinical_context
            })
            setIsEditingName(false)
        } catch (error) {
            console.error("Failed to update report name:", error)
        }
    }

    const generateReportText = (data: GeneralLabTestReport): string => {
        let formatted = `${editableName.toUpperCase()}\n\n`

        if (data.global_summary) {
            formatted += "Global Summary\n"
            if (data.global_summary.urgency_overall) {
                formatted += `Overall Urgency: ${formatEnumLabel(data.global_summary.urgency_overall)}\n\n`
            }
            if (data.global_summary.most_important_findings?.length) {
                formatted += "Most Important Findings:\n"
                data.global_summary.most_important_findings.forEach(finding => {
                    formatted += `  • ${displayOrNA(finding)}\n`
                })
                formatted += "\n"
            }
            if (data.global_summary.next_steps?.length) {
                formatted += "Next Steps:\n"
                data.global_summary.next_steps.forEach(step => {
                    formatted += `  • ${displayOrNA(step)}\n`
                })
                formatted += "\n"
            }
        }

        if (data.panel_summaries?.length) {
            formatted += "Panel Summaries\n"
            data.panel_summaries.forEach((panel, index) => {
                formatted += `\n[Panel ${index + 1}]\n`
                if (panel.urgency) {
                    formatted += `Urgency: ${formatEnumLabel(panel.urgency)}\n\n`
                }
                if (panel.overall_interpretation) {
                    formatted += `Overall Interpretation:\n`
                    formatted += `  - Summary: ${displayOrNA(panel.overall_interpretation.summary)}\n`
                    formatted += `  - Explanation: ${displayOrNA(panel.overall_interpretation.explanation)}\n\n`
                }
                if (panel.analytes_detailed_summary) {
                    formatted += `Analytes Detailed Summary:\n${displayOrNA(panel.analytes_detailed_summary)}\n\n`
                }
                if (panel.differential_diagnoses?.length) {
                    formatted += `Differential Diagnoses:\n`
                    panel.differential_diagnoses.forEach(diag => {
                        formatted += `  • ${diag.diagnosis}: ${displayOrNA(diag.explanation)}\n`
                    })
                    formatted += `\n`
                }
                if (panel.clinical_recommendations?.length) {
                    formatted += `Clinical Recommendations:\n`
                    panel.clinical_recommendations.forEach(rec => {
                        formatted += `  • ${rec}\n`
                    })
                    formatted += `\n`
                }
                if (panel.flags) {
                    formatted += `Flags:\n`
                    const criticalText =
                        panel.flags.critical_values && panel.flags.critical_values.length > 0
                            ? panel.flags.critical_values.join(", ")
                            : "N/A"
                    const abnormalText =
                        panel.flags.abnormal_values && panel.flags.abnormal_values.length > 0
                            ? panel.flags.abnormal_values.join(", ")
                            : "N/A"
                    formatted += `  - Critical Values: ${criticalText}\n`
                    formatted += `  - Abnormal Values: ${abnormalText}\n`
                }
                // no decorative separator between panels
            })
        }

        return formatted
    }

    const handleCopyReport = async () => {
        if (reportData) {
            const textContent = generateReportText(reportData)
            await navigator.clipboard.writeText(textContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleDownloadReport = () => {
        if (reportData) {
            const textContent = generateReportText(reportData)
            const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${editableName.replace(/\s+/g, "_")}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    }

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                    <p className="text-red-600 font-medium mb-2">We couldn’t complete the analysis.</p>
                    <p className="text-gray-700 text-sm mb-4">{errorMessage}</p>
                    <div className="flex items-center justify-center gap-2">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                Try again
                            </button>
                        )}
                        <button
                            onClick={() => setStep(0)}
                            className="px-4 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                            Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (content === "" || content === "Getting Summary...") {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <LoadingDiagnosis size={30} loadingText="Analysing data" />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-gray-50 rounded-xl flex flex-col relative overflow-x-hidden p-4 sm:p-6">
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
                        New <FaPlus />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyReport}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${copied ? "bg-green-100 text-green-600" : "hover:bg-gray-100"}`}>
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
                        <h2 className="text-xl sm:text-2xl font-bold flex-1 truncate">
                            {editableName || "Loading report name..."}
                        </h2>
                        {editableName && (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                                <AiOutlineEdit size={20} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            value={editableName}
                            onChange={e => setEditableName(e.target.value)}
                        />
                        <button
                            onClick={handleSaveName}
                            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                            <FaCheck size={18} />
                        </button>
                        <button
                            onClick={() => setIsEditingName(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                            <CgClose size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1 min-w-0">
                        <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">ID: {reportId}</span>
                    </div>
                    <div className="flex gap-4 mt-2 sm:mt-0">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(createdAt || new Date().toISOString())}</span>
                        </div>
                        {reportType && (
                            <div className="flex items-center gap-1">
                                <Activity className="w-4 h-4" />
                                <span>{reportType.replace(/_/g, " ").toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                {reportData ? (
                    <div className="space-y-8">
                        {reportData.global_summary && (
                            <section>
                                <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">
                                    Global Summary
                                </h3>
                                {reportData.global_summary.urgency_overall && (
                                    <p className="mb-4">
                                        <strong>Overall Urgency:</strong>{" "}
                                        {formatEnumLabel(reportData.global_summary.urgency_overall)}
                                    </p>
                                )}
                                {reportData.global_summary.most_important_findings && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-md mb-2">Most Important Findings:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {reportData.global_summary.most_important_findings.map((item, i) => (
                                                <li key={i}>{displayOrNA(item)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {reportData.global_summary.next_steps && (
                                    <div>
                                        <h4 className="font-semibold text-md mb-2">Next Steps:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {reportData.global_summary.next_steps.map((item, i) => (
                                                <li key={i}>{displayOrNA(item)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        )}
                        {reportData.panel_summaries?.map((panel, idx) => (
                            <section key={idx}>
                                <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">
                                    Panel Summary {idx + 1}
                                </h3>
                                {panel.urgency && (
                                    <p className="mb-4">
                                        <strong>Urgency:</strong> {formatEnumLabel(panel.urgency)}
                                    </p>
                                )}

                                {panel.overall_interpretation && (
                                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                        <h4 className="font-semibold text-md mb-2">Overall Interpretation</h4>
                                        <p>
                                            <strong>Summary:</strong>{" "}
                                            {displayOrNA(panel.overall_interpretation.summary)}
                                        </p>
                                        <p>
                                            <strong>Explanation:</strong>{" "}
                                            {displayOrNA(panel.overall_interpretation.explanation)}
                                        </p>
                                    </div>
                                )}

                                {panel.analytes_detailed_summary && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-md mb-2">Analytes Detailed Summary</h4>
                                        <p className="whitespace-pre-wrap">
                                            {displayOrNA(panel.analytes_detailed_summary)}
                                        </p>
                                    </div>
                                )}

                                {panel.differential_diagnoses && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-md mb-2">Differential Diagnoses</h4>
                                        <ul className="list-none space-y-2">
                                            {panel.differential_diagnoses.map((d, i) => (
                                                <li
                                                    key={i}
                                                    className="p-2 border-l-4 border-blue-400 bg-gray-50 rounded-r-lg">
                                                    <strong>{d.diagnosis}:</strong> {displayOrNA(d.explanation)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {panel.clinical_recommendations && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-md mb-2">Clinical Recommendations</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {panel.clinical_recommendations.map((rec, i) => (
                                                <li key={i}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {panel.flags && (
                                    <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                                        <h4 className="font-semibold text-md mb-2 flex items-center gap-2">
                                            <Flag size={16} /> Flags
                                        </h4>
                                        {panel.flags.critical_values ? (
                                            <div>
                                                <h5 className="font-semibold">
                                                    Critical Values:{" "}
                                                    {panel.flags.critical_values.length === 0 && (
                                                        <span className="font-normal text-gray-600">N/A</span>
                                                    )}
                                                </h5>
                                                {panel.flags.critical_values.length > 0 && (
                                                    <ul className="list-disc list-inside text-red-600">
                                                        {panel.flags.critical_values.map((v, i) => (
                                                            <li key={i}>{displayOrNA(v)}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ) : null}
                                        {panel.flags.abnormal_values ? (
                                            <div className="mt-2">
                                                <h5 className="font-semibold">
                                                    Abnormal Values:{" "}
                                                    {panel.flags.abnormal_values.length === 0 && (
                                                        <span className="font-normal text-gray-600">N/A</span>
                                                    )}
                                                </h5>
                                                {panel.flags.abnormal_values.length > 0 && (
                                                    <ul className="list-disc list-inside text-orange-600">
                                                        {panel.flags.abnormal_values.map((v, i) => (
                                                            <li key={i}>{displayOrNA(v)}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="prose prose-slate max-w-none">
                        <div className="font-sans text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                            {content}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

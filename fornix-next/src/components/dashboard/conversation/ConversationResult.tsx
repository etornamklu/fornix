import React, { useRef, useState, useEffect } from "react"
import Transcribed from "./TranscribedConversation"
import MedicalNotes from "./MedicalNotes"
import { TbLocationShare } from "react-icons/tb"
import { FiCopy } from "react-icons/fi"
import { IoClose } from "react-icons/io5"

import { AnimatePresence, motion } from "framer-motion"
import { AiOutlineEdit } from "react-icons/ai"
import { CgClose } from "react-icons/cg"
import { FaCheck } from "react-icons/fa"
import { updateReport, unlinkPatientFromReport } from "@/services/dashboard/report.service"
import { useReportStore } from "../../../../store/ReportStore"
import { copyToClipboard } from "@/utils/dashboard/clipboard"

import usePatientTranscriptStore from "../../../../store/Doc-patient-transcript"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import useConversationPageRouteStore from "../../../../store/ConversationPageRouteStore"
import Button from "@/components/global/Button"
import { FaStethoscope } from "react-icons/fa6"
import { DashboardPath, ReportType, UserConnectionsUser } from "@/utils/types"
import { REPORT_SPECIFIC_SECTIONS } from "@/utils/dashboard/helpers"
import PatientSelector from "@/components/global/PatientSelector"
import { getAllConnections } from "@/services/dashboard/connections.service"

export interface ITranscribedConversation {
    speaker: string
    message: string
}

interface ConversationResultProps {
    reportData?: any
    onClose?: () => void
    selectedPatient?: UserConnectionsUser | null
    onPatientSelect?: (patient: UserConnectionsUser) => void
    onPatientClear?: () => void
}

const ConversationResult = ({
    reportData,
    onClose,
    selectedPatient,
    onPatientSelect,
    onPatientClear
}: ConversationResultProps = {}) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const params = useParams()
    const slug = params.slug

    const { handleReportUpdated } = useReportStore()
    const [isEditingName, setIsEditingName] = useState(false)
    const [reportName, setReportName] = useState(reportData?.name || "History Taking")
    const [copySuccess, setCopySuccess] = useState<boolean>(false)
    const [currentPatient, setCurrentPatient] = useState<UserConnectionsUser | null>(selectedPatient || null)

    useEffect(() => {
        // Keep the name in sync if the reportData prop changes
        setReportName(reportData?.name || "History Taking")
    }, [reportData?.name])

    // Load linked patient when report loads
    useEffect(() => {
        // Always reset patient state first
        setCurrentPatient(null)

        // Use a flag to prevent race conditions
        let isCurrent = true

        const loadLinkedPatient = async () => {
            if (reportData?.patient_id) {
                try {
                    const connections = await getAllConnections()

                    // Check if this effect is still current before updating state
                    if (!isCurrent) {
                        return
                    }

                    if (connections && Array.isArray(connections)) {
                        // Find the connection that has the matching patient ID
                        const matchingConnection = connections.find((connection: any) => {
                            return connection.patient && connection.patient.id === reportData.patient_id
                        })

                        // Extract the patient from the connection
                        if (matchingConnection && matchingConnection.patient) {
                            const linkedPatient: UserConnectionsUser = matchingConnection.patient
                            setCurrentPatient(linkedPatient)
                        } else {
                            setCurrentPatient(null)
                        }
                    }
                } catch (error) {
                    console.error("Error loading linked patient:", error)
                    if (isCurrent) {
                        setCurrentPatient(null)
                    }
                }
            }
        }

        if (reportData?.id) {
            loadLinkedPatient()
        }

        // Cleanup function to mark this effect as stale
        return () => {
            isCurrent = false
        }
    }, [reportData?.id, reportData?.patient_id])

    const handleUpdateReportName = async () => {
        if (!reportName.trim() || !reportData || reportName.trim() === reportData.name) {
            setIsEditingName(false)
            if (reportData) {
                setReportName(reportData.name)
            }
            return
        }
        try {
            const updatedReport = await updateReport(reportData.id, { name: reportName.trim() }, reportData.type)
            handleReportUpdated(updatedReport)
        } catch (error) {
            console.error("Failed to update report name:", error)
            setReportName(reportData.name) // Revert name on error
        } finally {
            setIsEditingName(false)
        }
    }

    const handleCancelEditing = () => {
        if (reportData) {
            setReportName(reportData.name)
        }
        setIsEditingName(false)
    }

    const handlePatientLink = async (patient: UserConnectionsUser | null) => {
        if (reportData?.id) {
            try {
                if (patient) {
                    // Link patient using existing updateReport function
                    const updatedReport = await updateReport(
                        reportData.id,
                        { patient_id: patient.id },
                        ReportType.HistoryTaking
                    )
                    handleReportUpdated(updatedReport)
                    setCurrentPatient(patient)
                    onPatientSelect?.(patient)
                } else {
                    // Unlink patient using the new dedicated endpoint
                    const updatedReport = await unlinkPatientFromReport(reportData.id)
                    handleReportUpdated(updatedReport)
                    setCurrentPatient(null)
                    onPatientClear?.()
                }
            } catch (error) {
                console.error("Failed to link/unlink patient:", error)
            }
        }
    }

    const fetchTranscript = usePatientTranscriptStore(state => state.fetchTranscript)

    const [activeTab, setActiveTab] = useState("transcribed")
    const conversationRef = useRef<HTMLDivElement>(null)
    const medicalNotesRef = useRef<HTMLDivElement>(null)

    const reportContent = reportData?.content || reportData
    const rawTranscript = reportContent?.transcript || ""
    const reportMedicalNotes = reportContent?.medical_notes || {}

    const parseTranscript = (transcript: string) => {
        if (!transcript) return []

        const messages = []

        // Method 1: Try standard "doctor:" and "patient:" labels (new backend format)
        const standardRegex = /(doctor|patient):\s*([^]*?)(?=(?:\bdoctor\b|\bpatient\b|$))/g
        let match
        while ((match = standardRegex.exec(transcript)) !== null) {
            const speaker = match[1].charAt(0).toUpperCase() + match[1].slice(1)
            const message = match[2].trim().replace(/\n+/g, " ")

            if (message) {
                messages.push({ speaker, message })
            }
        }

        // If Method 1 worked, return the results
        if (messages.length > 0) {
            return messages
        }

        // Method 2: Try name-based patterns "Dr. Name," or "Name," (old format)
        const nameRegex = /(?:Dr\.\s+[A-Z][a-z]+,|[A-Z][a-z]+,)/g
        const parts = transcript.split(nameRegex)
        const speakers = transcript.match(nameRegex) || []

        for (let i = 0; i < speakers.length; i++) {
            const speaker = speakers[i].replace(",", "").trim()
            const message = parts[i + 1]?.trim()

            if (message) {
                messages.push({ speaker, message })
            }
        }

        // If Method 2 worked, return the results
        if (messages.length > 0) {
            return messages
        }

        // Method 3: Try simple colon-based patterns "Speaker: message"
        const colonRegex = /([A-Za-z\s.]+?):\s*([^]*?)(?=(?:[A-Za-z\s.]+?:|$))/g
        while ((match = colonRegex.exec(transcript)) !== null) {
            const speaker = match[1].trim()
            const message = match[2].trim().replace(/\n+/g, " ")

            if (message && speaker.length < 50) {
                // Reasonable speaker name length
                messages.push({ speaker, message })
            }
        }

        // If Method 3 worked, return the results
        if (messages.length > 0) {
            return messages
        }

        // Fallback: Show raw transcript as single message
        // Split by sentences or paragraphs to make it more readable
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)

        if (sentences.length > 1) {
            // Multiple sentences - break them up
            sentences.forEach((sentence, index) => {
                const trimmedSentence = sentence.trim()
                if (trimmedSentence) {
                    messages.push({
                        speaker: `Segment ${index + 1}`,
                        message: trimmedSentence
                    })
                }
            })
        } else {
            // Single block - show as one message
            messages.push({
                speaker: "Transcript",
                message: transcript.trim()
            })
        }

        return messages
    }

    const transcribedConversation = parseTranscript(rawTranscript)
    const isLoading = false
    const error = null

    const tabs = [
        { id: "transcribed", label: "Transcription" },
        { id: "medical", label: "Medical History" }
    ]

    const retry = () => {}

    const handleGetDiagnosis = () => {
        const reportId = reportData?.id
        if (reportId) {
            localStorage.removeItem("diag")
            localStorage.setItem("acc_t", JSON.stringify(reportId))
            router.push(`/dashboard${DashboardPath.Diagnosis}`)
        }
    }

    const handleCopyContent = async () => {
        let contentToCopy = ""

        if (activeTab === "transcribed") {
            contentToCopy = `${reportName}\n\nTranscription:\n`
            transcribedConversation.forEach(item => {
                contentToCopy += `${item.speaker}: ${item.message}\n\n`
            })
        } else {
            contentToCopy = `${reportName}\n\nMedical Notes:\n`
            if (reportMedicalNotes && typeof reportMedicalNotes === "object") {
                // Use the same order as defined in helpers.ts
                const orderedSections = REPORT_SPECIFIC_SECTIONS.history_taking

                // Map field names to exact UI titles
                const sectionTitles = {
                    demographics: "Demographic Details",
                    chief_complaint: "Chief Complaint",
                    history_of_present_illness: "History of Presenting Complaint",
                    review_of_systems: "Review of Systems",
                    social_history: "Social History",
                    medication_history: "Medication History and Allergies",
                    past_medical_history: "Past Medical History",
                    family_history: "Family History"
                }

                orderedSections.forEach(key => {
                    const value = reportMedicalNotes[key]
                    if (value) {
                        if (key === "demographics" && typeof value === "object") {
                            contentToCopy += `Demographic Details:\n`
                            contentToCopy += `Name: ${value.name || "Not provided"}\n`
                            contentToCopy += `Age: ${value.age || "Not provided"}\n`
                            contentToCopy += `Gender: ${value.gender || "Not provided"}\n`
                            contentToCopy += `Residence: ${value.residence || "Not provided"}\n\n`
                        } else {
                            const sectionTitle =
                                sectionTitles[key as keyof typeof sectionTitles] ||
                                key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                            contentToCopy += `${sectionTitle}:\n${value}\n\n`
                        }
                    }
                })
            } else {
                contentToCopy += String(reportMedicalNotes || "No medical notes available")
            }
        }

        await copyToClipboard(contentToCopy, () => {
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        })
    }

    const downloadTranscribedConversation = async () => {
        const element = conversationRef.current
        if (element) {
            const html2pdf = (await import("html2pdf.js")).default
            const opt = {
                margin: 0.5,
                filename: "conversation.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait"
                }
            }
            html2pdf().from(element).set(opt).save()
        }
    }

    const downloadMedicalNotes = async () => {
        const element = medicalNotesRef.current
        if (element) {
            const html2pdf = (await import("html2pdf.js")).default
            const opt = {
                margin: 0.5,
                filename: "medical_notes.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait"
                }
            }
            html2pdf().from(element).set(opt).save()
        }
    }

    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    return (
        <div className="p-2 pt-0 w-full h-full bg-white rounded-3xl flex flex-col overflow-x-hidden">
            <div className="w-full py-2 sticky top-0 bg-white flex justify-between items-center z-10">
                <div className="inline-block rounded-3xl px-[3px] py-[3px] bg-gray-100 w-fit top-0">
                    <button
                        className={`${
                            activeTab === "transcribed"
                                ? "bg-white text-slate-900 font-medium shadow-sm"
                                : "text-gray-500"
                        } rounded-3xl px-2 py-1 text-xs transition-all duration-75 ease-linear sm:px-4 sm:py-2 sm:text-sm`}
                        onClick={() => setActiveTab("transcribed")}>
                        Transcription
                    </button>
                    <button
                        className={`${
                            activeTab === "medical" ? "bg-white text-slate-900 font-medium shadow-sm" : "text-gray-500"
                        } rounded-3xl px-2 py-1 text-xs transition-all duration-75 ease-linear sm:px-4 sm:py-2 sm:text-sm`}
                        onClick={() => setActiveTab("medical")}>
                        Medical notes
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Patient Selector - Hidden on mobile */}
                    <div className="hidden sm:flex">
                        <PatientSelector
                            selectedPatient={currentPatient}
                            onPatientSelect={patient => handlePatientLink(patient)}
                            onPatientClear={() => handlePatientLink(null)}
                            buttonClassName="px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Close Button */}
                    {onClose && (
                        <button
                            onClick={() => {
                                onClose()
                                router.push(`/dashboard/acc/${slug}`)
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <IoClose size={24} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-t-3xl">
                {/* Group 1: Title and Edit button */}
                <div
                    className={`flex justify-start items-center gap-2 ${isEditingName ? "flex-1 lg:flex-initial" : "flex-1 lg:flex-initial"} min-w-0 mr-2`}>
                    {isEditingName ? (
                        <input
                            autoFocus
                            type="text"
                            value={reportName}
                            onChange={e => setReportName(e.target.value)}
                            className="text-lg font-semibold py-1 outline-none rounded px-2 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 flex-1 lg:w-64 lg:flex-initial min-w-0"
                        />
                    ) : (
                        <h2 className="text-lg font-semibold py-1 px-2 truncate flex-1" title={reportName}>
                            {reportName}
                        </h2>
                    )}

                    <AnimatePresence mode="wait">
                        {isEditingName ? (
                            <motion.div
                                className="text-gray-500"
                                key="enable-name-edit"
                                initial={{ opacity: 0, x: "-20%" }}
                                animate={{ opacity: 1, x: "0%" }}
                                exit={{ opacity: 0, x: "-20%" }}
                                transition={{ duration: 0.1 }}>
                                <div className="flex gap-1 sm:gap-3">
                                    <button onClick={handleCancelEditing} className="p-1">
                                        <CgClose className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
                                    </button>
                                    <button onClick={handleUpdateReportName} className="p-1">
                                        <FaCheck className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                role="button"
                                onClick={() => setIsEditingName(true)}
                                className="p-1"
                                key="disable-name-edit"
                                initial={{ opacity: 0, x: "20%" }}
                                animate={{ opacity: 1, x: "0%" }}
                                exit={{ opacity: 0, x: "20%" }}
                                transition={{ duration: 0.1 }}>
                                <AiOutlineEdit size={22} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Group 2: Action Buttons */}
                <div className={`flex items-stretch gap-3 ${isEditingName ? "hidden lg:flex" : "flex"}`}>
                    {/* copy btn */}
                    <Button
                        className={`px-4 py-3 flex items-center gap-1 ${
                            copySuccess ? "bg-green-100 text-green-600" : "bg-gray-400 hover:bg-gray-500 text-white"
                        }`}
                        onClick={handleCopyContent}>
                        {copySuccess ? (
                            <>
                                <FaCheck size={15} />
                                <span className="text-xs hidden sm:inline">Copied</span>
                            </>
                        ) : (
                            <>
                                <FiCopy size={15} />
                                <span className="hidden lg:block text-xs">Copy</span>
                            </>
                        )}
                    </Button>

                    <Button className="px-4 py-3 flex gap-1 justify-center items-center" onClick={handleGetDiagnosis}>
                        <FaStethoscope size={15} />
                        <span className="hidden lg:block">Get Diagnosis</span>
                    </Button>
                </div>
            </div>

            {/* Render the selected component */}
            <div className="bg-gray-100 rounded-b-2xl flex-grow box-border overflow-y-auto">
                {activeTab === "transcribed"
                    ? conversationRef && (
                          <Transcribed
                              downloadRef={conversationRef}
                              transcribedConvo={transcribedConversation}
                              error={error}
                              retry={retry}
                          />
                      )
                    : medicalNotesRef && (
                          <MedicalNotes
                              downloadRef={medicalNotesRef}
                              patientMedicalNotes={reportMedicalNotes}
                              error={error}
                              retry={retry}
                          />
                      )}
            </div>

            {/* Mobile Patient Selector - Fixed Bottom */}
            <div className="sm:hidden absolute left-0 right-0 mx-auto bottom-8 w-5/6 h-fit flex flex-col items-center justify-end z-20">
                <PatientSelector
                    className="w-full"
                    buttonClassName="w-full py-3 text-center justify-center bg-gray-50"
                    selectedPatient={currentPatient}
                    onPatientSelect={patient => handlePatientLink(patient)}
                    onPatientClear={() => handlePatientLink(null)}
                />
            </div>
        </div>
    )
}

export default ConversationResult

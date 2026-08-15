"use client"

import React, { useEffect, useState, ReactNode, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CgClose } from "react-icons/cg"
import { LuLoaderCircle } from "react-icons/lu"
import { FaCheckCircle } from "react-icons/fa"
import { CiCircleAlert } from "react-icons/ci"
import { FiCopy, FiDownload } from "react-icons/fi"
import { AiOutlineEdit, AiOutlineReload } from "react-icons/ai"
import { FaCheck } from "react-icons/fa6"
import { FiTrash2 } from "react-icons/fi"
import { MdSave } from "react-icons/md"
import { ReportType, DashboardPath, ReportData, Report } from "@/utils/types"

import {
    uploadRecording,
    updateReport,
    getReportById,
    unlinkPatientFromReport,
    uploadReportChunk,
    deleteReport
} from "@/services/dashboard/report.service"
import PatientSelector from "@/components/global/PatientSelector"
import { getAllConnections } from "@/services/dashboard/connections.service"

import {
    uploadAudioRecording,
    uploadHistoryTakingChunk,
    uploadHistoryTakingWithChunks,
    transcribe,
    generateReport,
    processStreamResponse
} from "@/services/dashboard/patient_history.service"
import { convertBlobToWav } from "@/utils/dashboard/converToWav"
import { parseReport } from "@/utils/dashboard/report"
import { useReportStore } from "../../../../store/ReportStore"

import { getNested, setNested } from "@/utils/dashboard/object-helpers"
import { UserConnectionsUser } from "@/utils/types"
import { formatReportForClipboard, copyToClipboard } from "@/utils/dashboard/clipboard"
import { flattenToString, REPORT_SPECIFIC_SECTIONS, getPathFromReportType } from "@/utils/dashboard/helpers"
import ProgressNoteReport from "./progress-notes/ProgressNoteReport"
import ProcedureNoteReport from "./procedure-note/ProcedureNoteReport"
import PhysicalExaminationReport from "./physical-examination/PhysicalExaminationReport"
import HistoryTakingReport from "./history-taking/HistoryTakingReport"
import OperativeNoteReport from "./operative-note/OperativeNoteReport"
import AdmissionNoteReport from "./admission-note/AdmissionNoteReport"
import DischargeSummaryReport from "./discharge-summary/DischargeSummaryReport"
import ReferralNoteReport from "./referral-note/ReferralNoteReport"
import { useReportAudioStore } from "../../../../store/ReportAudioStore"
import ConversationResult from "../conversation/ConversationResult"

interface Props {
    setStep: (step: number) => void
    reportStore?: {
        fetchReport: (id: string) => void
        selectedReport: any
        updateReport: (report: any) => void
    }
    selectedPatient: UserConnectionsUser | null
    clearSelectedPatient: () => void
}

type LoadingPhase = "analyzing" | "transcribing" | "generating" | "complete"
const PHASE_LABELS: Record<LoadingPhase, string> = {
    analyzing: "Analyzing audio",
    transcribing: "Transcribing speech",
    generating: "Generating report",
    complete: "Complete"
}

export default function GenericReportResult({ setStep, reportStore, selectedPatient, clearSelectedPatient }: Props) {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug

    // Move these useState declarations inside the component
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const getReportIdFromPath = (): string => {
        const path = window.location.pathname
        const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path
        const pathSegments = cleanPath.split("/")
        return pathSegments[pathSegments.length - 1].length === 36 ? pathSegments[pathSegments.length - 1] : ""
    }

    const reportId = getReportIdFromPath()

    const { audioBlob, clearAudioBlob } = useReportAudioStore()

    const [reportData, setReportData] = useState<Report | null>(null)
    const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null)

    const [localError, setLocalError] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    // Map technical errors to user-friendly messages
    const toFriendlyMessage = (err: unknown): string => {
        const raw = typeof err === "string" ? err : (err as any)?.message || ""
        const msg = String(raw)

        // Connectivity / offline / backend down
        if (
            /Failed to fetch|NetworkError|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED|Request timed out/i.test(msg)
        ) {
            return "We couldn't reach the server. Check your internet connection and try again."
        }

        // Server didn't complete stream properly
        if (/report_id/i.test(msg) || /did not return a report_id/i.test(msg)) {
            return "We couldn't finish generating your report. Please try again."
        }

        // Generic fallback
        return "We couldn't process your audio. Please try again."
    }

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [currentReportId, setCurrentReportId] = useState<string | null>(null)

    const [isEditingName, setIsEditingName] = useState(false)
    const [editableName, setEditableName] = useState("")

    const [copySuccess, setCopySuccess] = useState<boolean>(false)

    //patient state
    const [currentPatient, setCurrentPatient] = useState<UserConnectionsUser | null>(selectedPatient)

    // Track which sections are being edited
    const [editingSections, setEditingSections] = useState<Set<string>>(new Set())
    const [editableData, setEditableData] = useState<Report | null>(null)

    const [generatedReportId, setGeneratedReportId] = useState<string | null>(null)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Streaming content state
    const [streamingContent, setStreamingContent] = useState<string>("")
    const [isStreaming, setIsStreaming] = useState(false)

    // Retry functionality state
    const [isRetrying, setIsRetrying] = useState(false)

    const { getAllReports } = useReportStore()

    const handleDeleteReport = async () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        const currentData = editableData || reportStore?.selectedReport || reportData

        if (!currentData?.id) {
            setLocalError("Cannot delete: No report ID available")
            return
        }

        setIsDeleting(true)

        try {
            await deleteReport(currentData.id, currentReportType)

            // // Remove from store if using reportStore
            // if (reportStore) {
            //     // Remove from active report
            //     const store = useReportStore.getState()
            //     if (typeof store.setActiveReport === "function") {
            //         store.setActiveReport(null)
            //     }

            // Refresh reports list
            console.log("beans 174")
            await getAllReports()
            // }

            // Clear local state
            setEditableData(null)
            setReportData(null)
            setGeneratedReportId(null)

            // Navigate back to the recorder
            handleClose()
        } catch (error) {
            console.error("Failed to delete report:", error)
            setLocalError("Failed to delete report. Please try again.")
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const cancelDelete = () => {
        setShowDeleteConfirm(false)
    }

    useEffect(() => {
        if (reportStore?.selectedReport && loadingPhase !== "complete") {
            setLoadingPhase("complete")
        }
    }, [reportStore?.selectedReport, loadingPhase])

    const { fetchReports } = useReportStore()

    const contentRef = useRef<HTMLDivElement>(null)
    const isMounted = useRef<boolean>(false)

    const getReportTypeFromUrl = (): ReportType => {
        const pathname = window.location.pathname
        const urlToReportType: Record<string, ReportType> = {
            "physical-examination": ReportType.PhysicalExamination,
            "progress-note": ReportType.ProgressNote,
            "admission-note": ReportType.AdmissionNote,
            "operative-note": ReportType.OperativeNote,
            "procedure-note": ReportType.ProcedureNote,
            "discharge-summary": ReportType.DischargeSummary,
            "death-note": ReportType.DeathNote,
            "referral-note": ReportType.ReferralNote,
            "history-taking": ReportType.HistoryTaking
        }
        for (const [urlSegment, reportType] of Object.entries(urlToReportType)) {
            if (pathname.includes(urlSegment)) {
                return reportType
            }
        }
        return ReportType.PhysicalExamination
    }

    const currentReportType = getReportTypeFromUrl()

    const formatReportType = (type: ReportType) => {
        return type.replace("_", " ").trim()
    }

    const handleClose = () => {
        try {
            // 1) Immediately switch the UI back to the recorder step so the report UI closes right away.
            setStep(0)

            // 2) Clear patient selection (prop passed in from parent)
            try {
                clearSelectedPatient()
            } catch (err) {
                // defensive: if parent didn't pass it or it fails, continue
                console.warn("clearSelectedPatient failed:", err)
            }

            // 3) Clear any active report in the global store so nav / lists don't keep the stale report active
            try {
                // this matches how the component sets an active report elsewhere:
                const store = useReportStore.getState()
                if (typeof store.setActiveReport === "function") {
                    store.setActiveReport(null)
                }
            } catch (err) {
                console.warn("Failed to clear active report in store:", err)
            }

            // 4) Reset local component state that would otherwise keep the report visible
            setEditableData(null)
            setReportData(null)
            setGeneratedReportId(null)
            setStreamingContent("")
            setLoadingPhase(null)
            setIsStreaming(false)
            setLocalError(null)

            // 5) Compute a sensible base path to return to.
            // Prefer the report's type (if we have it), otherwise fall back to the currentReportType derived from the URL.
            const currentData = editableData || reportStore?.selectedReport || reportData
            const reportTypeForPath =
                currentData && (currentData as any).type ? (currentData as any).type : currentReportType

            // getPathFromReportType is used elsewhere in the file and returns the path segment (eg "/history-taking")
            let basePath = ""
            try {
                basePath = getPathFromReportType(reportTypeForPath)
            } catch (err) {
                // fallback to a safe default if something odd happened
                basePath = getPathFromReportType(ReportType.PhysicalExamination)
            }

            // 6) Navigate to the recorder view for that report type (replace history so user doesn't need to hit Back)
            // The RecordReport/ReportConversation uses setStep(0) to show the recorder. This navigation keeps URL consistent.
            router.replace(`/dashboard/acc${basePath}`)
        } catch (err) {
            // Last-resort fallback: still set step to recorder so the UI closes even on unexpected errors.
            console.error("handleClose unexpected error:", err)
            setStep(0)
            router.replace(`/dashboard/acc${getPathFromReportType(currentReportType)}`)
        }
    }

    const handlePatientLink = async (patient: UserConnectionsUser | null) => {
        const currentData = editableData || reportStore?.selectedReport || reportData

        if (currentData?.id) {
            try {
                if (patient) {
                    // Link patient using existing updateReport function
                    const updatedReport = await updateReport(
                        currentData.id,
                        { patient_id: patient.id },
                        currentReportType
                    )
                    setReportData(updatedReport)
                    setEditableData(updatedReport)
                    if (reportStore?.updateReport) {
                        reportStore.updateReport(updatedReport)
                    }
                    setCurrentPatient(patient)
                } else {
                    // Unlink patient using the new dedicated endpoint
                    const updatedReport = await unlinkPatientFromReport(currentData.id)
                    setReportData(updatedReport)
                    setEditableData(updatedReport)
                    if (reportStore?.updateReport) {
                        reportStore.updateReport(updatedReport)
                    }
                    setCurrentPatient(patient)
                }
            } catch (error) {
                console.error("Failed to link/unlink patient:", error)
            }
        }
    }

    // Upload processing function that can be reused for initial upload and retry
    const processAudioUpload = async () => {
        if (!audioBlob) {
            throw new Error("No audio data available")
        }

        const wav = await convertBlobToWav(audioBlob)
        setLoadingPhase("transcribing")
        let accumulatedContent = ""

        console.log("patient id to link", selectedPatient?.id)

        if (currentReportType === ReportType.HistoryTaking) {
            // Use doc-patient workflow for history-taking
            setLoadingPhase("analyzing")
            const { res: uploadRes, uploadErr } = await uploadAudioRecording(wav)
            if (uploadErr) {
                throw new Error(uploadErr)
            }

            setLoadingPhase("transcribing")
            const { res: transcribeRes, transcribeErr } = await transcribe(uploadRes.upload_id)
            if (transcribeErr) {
                throw new Error(transcribeErr)
            }

            setLoadingPhase("generating")
            const reportData = await generateReport(transcribeRes.job_id)
            if (!reportData) {
                throw new Error("Failed to generate report")
            }

            const processedReport = processStreamResponse(reportData)
            if (!isMounted.current) return
            if (!processedReport || !processedReport.raw_transcript || !processedReport.medical_notes) {
                throw new Error("Invalid report format")
            }

            // Create the report structure for history-taking
            const historyTakingReport: Report = {
                id: transcribeRes.job_id,
                name: `History Taking ${new Date().toISOString().slice(0, 19).replace("T", "_")}`,
                type: ReportType.HistoryTaking,
                audio_id: "",
                content: {
                    transcript: processedReport.raw_transcript.transcript,
                    medical_notes: processedReport.medical_notes
                }
            }

            console.log("History-taking report created with ID:", transcribeRes.job_id)

            // Navigate immediately and let the destination page handle display
            const newPath = `/dashboard/acc${getPathFromReportType(ReportType.HistoryTaking)}/${transcribeRes.job_id}`
            router.replace(newPath)
            console.log("Navigation completed")
        } else {
            // Use standard doctor/report workflow for other reports
            await uploadRecording(
                wav,
                `${currentReportType}-report.wav`,
                currentReportType,
                (partialText: string, reportId?: string) => {
                    if (!isMounted.current) return
                    if (reportId) {
                        setGeneratedReportId(reportId)
                        console.log("Audio blob processing with report ID:", reportId)
                    }

                    accumulatedContent = partialText
                    setStreamingContent(partialText)
                    setLoadingPhase("generating")
                },
                async (reportId?: string) => {
                    if (!isMounted.current) return
                    if (reportId) {
                        setCurrentReportId(reportId)
                    }
                    console.log("Upload stream completed")
                    setIsStreaming(false)

                    try {
                        if (!reportId) {
                            throw new Error("No report ID was returned from the server.")
                        }

                        // Fetch the full, canonical report object from the server
                        const finalReport = await getReportById(reportId)
                        if (!finalReport) {
                            throw new Error("Failed to fetch the final report from the server.")
                        }

                        if (!isMounted.current) return

                        // --- STATE FIRST, THEN NAVIGATE ---
                        // 1. Set active report in the store.
                        useReportStore.getState().setActiveReport(finalReport)
                        // 2. Update the navbar list with the complete report object.
                        useReportStore.getState().handleReportCreated(finalReport)
                        // 3. Update local component state.
                        setReportData(finalReport)
                        setEditableData(finalReport)
                        setLoadingPhase("complete")
                        setStreamingContent("")

                        console.log("Standard report created and state updated:", finalReport)

                        // 4. Navigate now that state is stable.
                        const newPath = `/dashboard/acc${getPathFromReportType(finalReport.type)}/${finalReport.id}`
                        console.log("Navigating to:", newPath)
                        router.replace(newPath)

                        // Clear audio blob after successful completion
                        console.log("Clearing audio blob after successful completion.")
                        clearAudioBlob()
                    } catch (error) {
                        console.error("Failed to process created report:", error)
                        throw new Error("Failed to process server response")
                    }
                },
                (err: Error) => {
                    // Immediate error from service (open failure, SSE error, timeout, connection refused)
                    setUploadError(toFriendlyMessage(err))
                    setLoadingPhase(null)
                    setIsStreaming(false)
                },
                (ctrl: AbortController) => {
                    // Provide cancel button functionality
                    cancelController.current = ctrl
                }
            )
        }
    }

    useEffect(() => {
        console.log("🔄 useEffect TRIGGERED with:", {
            audioBlob: audioBlob ? "EXISTS" : "NULL",
            currentReportType,
            selectedPatient: selectedPatient?.name || "undefined",
            isMounted: isMounted.current
        })

        const initializeData = async () => {
            setCurrentPatient(null)

            if (audioBlob) {
                if (isMounted.current) return
                console.log("STARTING uploadRecording process")
                try {
                    isMounted.current = true
                    setLocalError(null)
                    setReportData(null)
                    setStreamingContent("")
                    setIsStreaming(true)
                    setLoadingPhase("analyzing")

                    const wav = await convertBlobToWav(audioBlob)
                    setLoadingPhase("transcribing")

                    console.log("patient id to link", selectedPatient?.id)

                    if (currentReportType === ReportType.HistoryTaking) {
                        // NEW CHUNKING APPROACH FOR HISTORY-TAKING
                        try {
                            setLoadingPhase("analyzing")

                            const reportIdForFinal = getReportIdFromPath() || generatedReportId || currentReportId

                            let sseText = ""

                            console.log(
                                "[HT] FINAL CHUNK: starting stream for reportId:",
                                reportIdForFinal,
                                "blob size:",
                                audioBlob.size
                            )
                            const finalArgs: {
                                file: Blob
                                patientId?: string
                                lastChunk: boolean
                                reportId?: string
                                onMessage: (partialText: string, rid?: string) => void
                                onClose: (rid?: string) => void
                            } = {
                                file: audioBlob,
                                patientId: selectedPatient?.id,
                                lastChunk: true,
                                onMessage: (partialText, rid) => {
                                    if (rid && !generatedReportId) {
                                        setGeneratedReportId(rid)
                                    }
                                    sseText += partialText
                                    setStreamingContent(sseText)
                                    setLoadingPhase("generating")
                                },
                                onClose: async rid => {
                                    console.log("[HT] STREAM CLOSED: finalId:", rid || reportIdForFinal)
                                    const finalId = rid || reportIdForFinal
                                    if (!finalId) {
                                        throw new Error("No report ID returned from server")
                                    }

                                    setIsStreaming(false)

                                    try {
                                        const finalReport = await getReportById(finalId)
                                        if (!finalReport) {
                                            throw new Error("Failed to fetch final report from server")
                                        }

                                        // Update all relevant stores and state
                                        useReportStore.getState().setActiveReport(finalReport)
                                        useReportStore.getState().handleReportCreated(finalReport)
                                        setReportData(finalReport)
                                        setEditableData(finalReport)
                                        setLoadingPhase("complete")
                                        setStreamingContent("")

                                        // Navigate to the report page
                                        const newPath = `/dashboard/acc${getPathFromReportType(ReportType.HistoryTaking)}/${finalId}`
                                        router.replace(newPath)
                                    } catch (fetchError) {
                                        console.error("Failed to process completed history-taking report:", fetchError)
                                        throw new Error("Failed to process server response")
                                    }
                                }
                            }
                            if (reportIdForFinal) finalArgs.reportId = reportIdForFinal
                            await uploadHistoryTakingChunk(finalArgs)
                        } catch (error: any) {
                            console.error("History-taking workflow error:", error)
                            setLocalError(error.message || "Processing failed")
                            setLoadingPhase(null)
                            setIsStreaming(false)
                        }
                    } else {
                        let sseText = ""
                        await uploadReportChunk({
                            file: audioBlob,
                            reportType: currentReportType,
                            reportId: getReportIdFromPath(),
                            lastChunk: true,
                            patientId: selectedPatient?.id,
                            onMessage: (partialText, reportId) => {
                                sseText += partialText
                                if (reportId) setGeneratedReportId(reportId)
                                setStreamingContent(sseText)
                                setLoadingPhase("generating")
                            },
                            onClose: async finalId => {
                                const id = finalId || getReportIdFromPath()
                                if (!id) throw new Error("No report ID")
                                const finalReport = await getReportById(id)
                                useReportStore.getState().setActiveReport(finalReport)
                                useReportStore.getState().handleReportCreated(finalReport)
                                setReportData(finalReport)
                                setEditableData(finalReport)
                                setLoadingPhase("complete")
                                setStreamingContent("")
                                router.replace(
                                    `/dashboard/acc${getPathFromReportType(finalReport.type)}/${finalReport.id}`
                                )
                            }
                        })
                    }
                } catch (e: any) {
                    console.error("Upload recording error:", e)
                    setUploadError(toFriendlyMessage(e))
                    setLoadingPhase(null)
                    setIsStreaming(false)
                    isMounted.current = false
                } finally {
                    isMounted.current = true
                    console.log("Clearing audio blob from the store.")
                    clearAudioBlob()
                }
            }
        }
        initializeData()
    }, [selectedPatient])

    // Cleanup effect
    useEffect(() => {
        return () => {
            // Cleanup on unmount only if there was an error
            if (isMounted.current === false && localError) {
                clearAudioBlob()
            }
        }
    }, [localError])

    useEffect(() => {
        const currentData = reportStore?.selectedReport || reportData
        if (currentData) {
            const defaultName = `REPORT_${new Date().toISOString().slice(0, 19).replace("T", "_")}`
            setEditableName((currentData as any).name || defaultName)
            setEditableData(currentData)
        }
    }, [reportStore?.selectedReport, reportData, currentReportType, isEditingName])

    //useEffect to load linked patient when report loads
    useEffect(() => {
        const currentData = editableData || reportStore?.selectedReport || reportData
        const currentReportId = currentData?.id

        // Always reset patient state first when report changes
        setCurrentPatient(null)

        // Use a flag to prevent race conditions
        let isCurrent = true

        const loadLinkedPatient = async () => {
            if (currentData?.patient_id) {
                try {
                    const connections = await getAllConnections()

                    // Check if this effect is still current before updating state
                    if (!isCurrent) {
                        return
                    }

                    if (connections && Array.isArray(connections)) {
                        // Find the connection that has the matching patient ID
                        const matchingConnection = connections.find((connection: any) => {
                            return connection.patient && connection.patient.id === currentData.patient_id
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

        if (currentReportId) {
            loadLinkedPatient()
        }

        // Cleanup function to mark this effect as stale
        return () => {
            isCurrent = false
        }
    }, [editableData?.id, reportStore?.selectedReport?.id, reportData?.id])

    const handleCopyReport = async () => {
        const sectionsToDisplay = REPORT_SPECIFIC_SECTIONS[currentReportType] || []
        const formattedReport = formatReportForClipboard(editableName, currentData!, () => sectionsToDisplay)

        await copyToClipboard(formattedReport, () => {
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        })
    }

    const saveName = async () => {
        try {
            const currentData = reportStore?.selectedReport || reportData

            // Get report ID from multiple sources
            const reportId = (currentData as any)?.id || currentReportId || generatedReportId

            if (!reportId) {
                console.error("Cannot save name: No report ID available")
                setLocalError("Cannot save name: Report ID not found")
                return
            }

            console.log("Saving name with report ID:", reportId)
            const updated = await updateReport(reportId, { name: editableName }, currentReportType)

            if (reportStore) {
                reportStore.updateReport(updated)
            } else {
                setReportData(updated)
                setEditableData(updated)
            }

            setHasUnsavedChanges(false)
        } catch (error) {
            console.error("Failed to save report name:", error)
            setLocalError("Failed to save report name")
        } finally {
            setIsEditingName(false)
        }
    }

    const startEditingSection = (section: string) => {
        setEditingSections(prev => new Set([...prev, section]))
        if (!editableData || !getNested(editableData, section)) {
            const currentData = editableData || reportStore?.selectedReport || reportData || {}
            let initialValue: any = ""
            if (
                section.includes("vital_signs") ||
                section.includes("medications") ||
                section.includes("allergies") ||
                section.includes("history")
            ) {
                initialValue = section.includes("vital_signs") ? {} : []
            }
            setEditableData({ ...currentData, [section]: initialValue })
        }
    }

    const cancelEditingSection = (section: string) => {
        setEditingSections(prev => {
            const newSet = new Set(prev)
            newSet.delete(section)
            return newSet
        })
        const originalData = reportStore?.selectedReport || reportData
        if (originalData && editableData) {
            const originalValue = getNested(originalData, section)
            setEditableData((prev: ReportData | null) => {
                if (!prev) return null
                const newData = JSON.parse(JSON.stringify(prev))
                setNested(newData, section, originalValue)
                return newData
            })
        }
    }

    const saveSection = async (section: string, data?: any) => {
        // The data parameter is new. It will be provided by our new SectionEditor.
        if (!editableData) return

        try {
            const reportId = editableData.id
            if (!reportId) {
                console.error("Cannot save: No report ID available.")
                return
            }

            let updatePayload: any

            // NEW LOGIC FOR PROGRESS NOTES
            if (
                currentReportType === ReportType.ProgressNote ||
                currentReportType === ReportType.ProcedureNote ||
                currentReportType === ReportType.PhysicalExamination ||
                currentReportType === ReportType.HistoryTaking ||
                currentReportType === ReportType.OperativeNote ||
                currentReportType === ReportType.AdmissionNote ||
                currentReportType === ReportType.DischargeSummary ||
                currentReportType === ReportType.ReferralNote
            ) {
                console.log("Saving Progress Note section:", section)
                const contentSource = editableData.content || editableData
                const newContent = JSON.parse(JSON.stringify(contentSource))

                // We update the specific part of the content object (e.g., 'subjective', 'objective').
                newContent[section] = data
                // The payload for the API is the entire, updated 'content' object.
                updatePayload = { content: newContent }
                console.log("Sending correct content payload:", updatePayload)
            } else {
                updatePayload = { [section]: data }
            }
            const updatedReport = await updateReport(reportId, updatePayload, currentReportType)

            if (reportStore) {
                reportStore.updateReport(updatedReport)
            } else {
                setReportData(updatedReport)
            }
            setEditableData(updatedReport)

            // Exit editing mode for this section.
            setEditingSections(prev => {
                const newSet = new Set(prev)
                newSet.delete(section)
                return newSet
            })
        } catch (error) {
            console.error("Failed to save section:", error)
            setLocalError("Failed to save changes.")
        }
    }

    const getPhaseIcon = (phase: LoadingPhase) => {
        if (localError) return <CiCircleAlert className="w-5 h-5 text-red-600" />
        const phaseOrder: LoadingPhase[] = ["analyzing", "transcribing", "generating", "complete"]
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

    const ErrorModal = () => {
        const handleRetry = async () => {
            if (!audioBlob) {
                setUploadError("No audio data available to retry")
                return
            }

            setIsRetrying(true)
            setUploadError(null)

            try {
                // Reset states for retry
                setReportData(null)
                setStreamingContent("")
                setIsStreaming(true)
                setLoadingPhase("analyzing")

                // Clear previous report ID
                setCurrentReportId(null)
                setGeneratedReportId(null)

                console.log("🔄 RETRYING upload process")

                await processAudioUpload()
            } catch (e: any) {
                console.error("Retry upload recording error:", e)
                setUploadError(toFriendlyMessage(e))
                setLoadingPhase(null)
                setIsStreaming(false)
            } finally {
                setIsRetrying(false)
            }
        }

        const handleCancel = () => {
            setUploadError(null)
            clearAudioBlob()
            handleClose()
        }

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
                    <div className="p-4 sm:p-6 text-center">
                        <CiCircleAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Upload Failed</h3>
                        <div className="mb-6">
                            <p className="text-sm sm:text-base text-gray-600 mb-2">
                                We encountered an error while processing your audio:
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                                <p className="text-sm text-red-700 font-mono break-words">{uploadError}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleRetry}
                                disabled={isRetrying || !audioBlob}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isRetrying ? (
                                    <>
                                        <LuLoaderCircle className="w-4 h-4 animate-spin" />
                                        <span>Retrying...</span>
                                    </>
                                ) : (
                                    <>
                                        <AiOutlineReload className="w-4 h-4" />
                                        <span>Try Again</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleCancel}
                                disabled={isRetrying}
                                className="w-full px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Cancel
                            </button>
                        </div>

                        {!audioBlob && (
                            <p className="text-xs text-gray-500 mt-2">
                                No audio data available for retry. Please record again.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const DeleteConfirmationModal = () => {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
                    <div className="p-4 sm:p-6 text-center">
                        <FiTrash2 className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Delete Report</h3>
                        <div className="mb-6">
                            <p className="text-sm sm:text-base text-gray-600 mb-2">
                                Are you sure you want to delete this report?
                            </p>
                            <p className="text-sm text-gray-500">
                                <span className="text-gray-700 font-semibold">{editableName}</span> will be permanently
                                deleted and cannot be recovered.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isDeleting ? (
                                    <>
                                        <LuLoaderCircle className="w-4 h-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 className="w-4 h-4" />
                                        <span>Delete Report</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={cancelDelete}
                                disabled={isDeleting}
                                className="w-full px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    const cancelController = useRef<AbortController | null>(null)
    const handleCancelProcessing = () => {
        if (cancelController.current) {
            cancelController.current.abort()
        }
        setUploadError("Processing was canceled")
        setLoadingPhase(null)
        setIsStreaming(false)
    }

    const LoadingModal = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">
                            Processing {formatReportType(currentReportType)}
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Please wait while we process your recording
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
                                                {ph === "analyzing" && "Analyzing your audio recording..."}
                                                {ph === "transcribing" && "Converting audio to report..."}
                                                {ph === "generating" && "Creating your report..."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={handleCancelProcessing}
                            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const currentData = editableData || reportStore?.selectedReport || reportData

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-white rounded-xl flex flex-col relative overflow-x-hidden p-4 sm:p-6">
            {uploadError && <ErrorModal />}
            {showDeleteConfirm && <DeleteConfirmationModal />}
            {(loadingPhase === "analyzing" || loadingPhase === "transcribing") && <LoadingModal />}
            {loadingPhase === "generating" && streamingContent && (
                <div className="flex flex-col h-full">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div className="flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">
                                Generating {formatReportType(currentReportType)}
                            </h2>
                            <div className="flex items-center gap-2 text-blue-600">
                                <LuLoaderCircle className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Report generation in progress...</span>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="self-start px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                            Cancel
                        </button>
                    </div>
                    <div className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto">
                        <div className="prose max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-white p-3 rounded border">
                                {streamingContent}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {loadingPhase === "complete" &&
                currentData &&
                (currentReportType === ReportType.HistoryTaking ? (
                    // For history-taking, render ConversationResult directly without wrapper
                    <ConversationResult
                        reportData={currentData}
                        onClose={() => setStep(0)}
                        selectedPatient={currentPatient}
                        onPatientSelect={patient => handlePatientLink(patient)}
                        onPatientClear={() => handlePatientLink(null)}
                    />
                ) : (
                    // For other report types, use the normal wrapper
                    <div className="flex flex-col h-full" ref={contentRef}>
                        <div className="flex justify-between items-center gap-4 mb-4 sm:mb-6">
                            {/* Left: Close button */}
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                                Close
                            </button>

                            {/* Right: Copy button and Patient Selector */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        console.log("clicked")
                                        handleCopyReport()
                                    }}
                                    className={`px-4 py-2 h-10 rounded-lg transition-colors flex items-center gap-2 ${copySuccess ? "bg-green-100 text-green-600" : "bg-gray-100 hover:bg-gray-200"}`}>
                                    {copySuccess ? (
                                        <>
                                            <FaCheck size={16} />
                                            <span className="text-sm">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiCopy size={16} />
                                            <span className="text-sm hidden sm:inline">Copy</span>
                                        </>
                                    )}
                                </button>

                                <PatientSelector
                                    selectedPatient={currentPatient}
                                    onPatientSelect={patient => handlePatientLink(patient)}
                                    onPatientClear={() => handlePatientLink(null)}
                                    className=""
                                    buttonClassName=""
                                />
                                <button
                                    onClick={handleDeleteReport}
                                    disabled={isDeleting}
                                    className={`px-4 py-2 h-10 rounded-lg transition-colors flex items-center gap-2 ${
                                        isDeleting
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-red-100 hover:bg-red-200 text-red-600"
                                    }`}>
                                    {isDeleting ? (
                                        <LuLoaderCircle className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <FiTrash2 size={16} />
                                    )}
                                    <span className="text-sm hidden sm:inline">
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="mb-4 flex items-center gap-2">
                            {!isEditingName ? (
                                <>
                                    <h2 className="text-xl sm:text-2xl font-bold flex-1 break-words">{editableName}</h2>
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
                                            const originalData = reportStore?.selectedReport || reportData
                                            const defaultName = `${formatReportType(
                                                currentReportType
                                            )} ${new Date().toLocaleDateString()}`
                                            setEditableName((originalData as any)?.name || defaultName)
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                                        <CgClose size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow overflow-y-auto pr-1 sm:pr-2">
                            <div className="prose prose-sm sm:prose-base max-w-none">
                                <ReportItemRenderer />
                            </div>
                        </div>
                    </div>
                ))}

            {!loadingPhase && !currentData && (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                    <span className="text-sm sm:text-base">No data to display.</span>
                </div>
            )}
        </motion.div>
    )

    function ReportItemRenderer() {
        if (!currentData) {
            return <div className="flex-grow flex items-center justify-center text-gray-500">No data to display.</div>
        }

        // Check if report has empty or invalid content
        const isEmpty =
            !currentData.content ||
            (typeof currentData.content === "object" && Object.keys(currentData.content).length === 0) ||
            (typeof currentData.content === "string" && currentData.content.trim() === "") ||
            // Add this: check if all content values are empty
            (typeof currentData.content === "object" &&
                Object.values(currentData.content).every(
                    value =>
                        !value ||
                        (typeof value === "string" && value.trim() === "") ||
                        (typeof value === "object" && (!value || Object.keys(value).length === 0))
                ))

        if (isEmpty) {
            return (
                <div className="flex-grow flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="mb-4">
                            <CiCircleAlert className="w-16 h-16 text-amber-500 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">No relevant information detected</h3>
                        <p className="text-gray-600 mb-4">
                            The recording could not be processed into a{" "}
                            {formatReportType(currentReportType).toLowerCase()}. This may happen if the audio doesnt
                            contain relevant medical information or discussions.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Try Recording Again
                        </button>
                    </div>
                </div>
            )
        }

        switch (currentReportType) {
            case ReportType.ProgressNote:
                return (
                    <ProgressNoteReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            case ReportType.ProcedureNote:
                return (
                    <ProcedureNoteReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            case ReportType.PhysicalExamination:
                return (
                    <PhysicalExaminationReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            case ReportType.HistoryTaking:
                return (
                    <ConversationResult
                        reportData={currentData}
                        selectedPatient={currentPatient}
                        onPatientSelect={patient => handlePatientLink(patient)}
                        onPatientClear={() => handlePatientLink(null)}
                    />
                )

            case ReportType.OperativeNote:
                return (
                    <OperativeNoteReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            case ReportType.AdmissionNote:
                return (
                    <AdmissionNoteReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            case ReportType.DischargeSummary:
                return (
                    <DischargeSummaryReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            case ReportType.ReferralNote:
                return (
                    <ReferralNoteReport
                        reportData={currentData as any}
                        onStartEditing={startEditingSection}
                        onSave={saveSection}
                        onCancel={cancelEditingSection}
                        editingSections={editingSections}
                    />
                )

            default:
                return <div className="text-red-500">No specific renderer for report type: {currentReportType}</div>
        }
    }
}

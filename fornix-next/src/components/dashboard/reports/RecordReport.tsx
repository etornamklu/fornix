import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useSearchParams, usePathname } from "next/navigation"
import padNumber from "@/utils/padNumber"
import { BsCheck } from "react-icons/bs"
import { CgPlayPauseR, CgClose } from "react-icons/cg"
import { AiOutlineReload } from "react-icons/ai"
import { IoPlayOutline } from "react-icons/io5"
import { LuPencilLine } from "react-icons/lu"
import { motion } from "framer-motion"
import { useTimer } from "../conversation/useTimer"
import { ReportType, UserConnectionsUser } from "@/utils/types"
import Recording from "@/assets/recording.svg"
import StartRecording from "@/assets/start.svg"
import StoppedRecording from "@/assets/paused.svg"
import Button from "@/components/global/Button"
import PatientSelector from "@/components/global/PatientSelector"
import { useReportAudioStore } from "../../../../store/ReportAudioStore"
import { useSelectedPatientStore } from "../../../../store/SelectedPatientStore"
import { useReportStore } from "../../../../store/ReportStore"

import { uploadReportChunk } from "@/services/dashboard/report.service"
import { uploadHistoryTakingChunk } from "@/services/dashboard/patient_history.service"

import { useRouter } from "next/navigation"
import { getPathFromReportType } from "@/utils/dashboard/helpers"

interface RecordDoctorProps {
    setStep: (value: number) => void
    openConnectionList: () => void
    selectedPatient: UserConnectionsUser | null
    clearSelectedPatient: () => void
}

const RecordReport: React.FC<RecordDoctorProps> = ({ setStep, openConnectionList }) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [audioChunks, setAudioChunks] = useState<Blob[]>([])
    const { setAudioBlob, clearAudioBlob } = useReportAudioStore()
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
    const [preferredMimeType, setPreferredMimeType] = useState<string>("audio/wav")
    const [showMicPermissionModal, setShowMicPermissionModal] = useState(false)
    const [readyToRecord, setReadyToRecord] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [loadingPhase, setLoadingPhase] = useState<"analyzing" | "transcribing" | "generating" | "complete" | null>(
        null
    )
    const [streamingContent, setStreamingContent] = useState<string>("")

    // Loading phase labels
    const PHASE_LABELS: Record<"analyzing" | "transcribing" | "generating" | "complete", string> = {
        analyzing: "Analyzing audio",
        transcribing: "Transcribing speech",
        generating: "Generating report",
        complete: "Complete"
    }

    // Phase icon function
    const getPhaseIcon = (phase: "analyzing" | "transcribing" | "generating" | "complete") => {
        const phaseOrder: ("analyzing" | "transcribing" | "generating" | "complete")[] = [
            "analyzing",
            "transcribing",
            "generating",
            "complete"
        ]
        const currentPhaseIndex = loadingPhase ? phaseOrder.indexOf(loadingPhase) : -1
        const thisPhaseIndex = phaseOrder.indexOf(phase)
        if (loadingPhase === phase) {
            return (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )
        }
        if (currentPhaseIndex > thisPhaseIndex) {
            return (
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                </div>
            )
        }
        return <div className="w-5 h-5" />
    }

    // Loading modal component
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
                        {(Object.keys(PHASE_LABELS) as ("analyzing" | "transcribing" | "generating" | "complete")[])
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
                            onClick={() => {
                                setIsProcessing(false)
                                setLoadingPhase(null)
                            }}
                            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [commands, setCommands] = useState({
        isRecording: false,
        isReset: false,
        isEnded: true,
        isPaused: false
    })

    const { timeElapsed, time, resetTimer } = useTimer(commands.isRecording)

    const { selectedPatient, setSelectedPatient, clearSelectedPatient } = useSelectedPatientStore()

    // Report structure templates
    const reportStructures = {
        [ReportType.PhysicalExamination]: [
            "General Appearance",
            "Vital Signs",
            "Head and Neck",
            "Cardiovascular System",
            "Respiratory System",
            "Abdominal Examination",
            "Neurological Assessment",
            "Musculoskeletal System",
            "Skin and Lymph Nodes",
            "Summary and Impression"
        ],
        [ReportType.HistoryTaking]: [
            "Chief Complaint",
            "History of Present Illness",
            "Past Medical History",
            "Medications and Allergies",
            "Family History",
            "Social History",
            "Review of Systems",
            "Summary"
        ],
        [ReportType.ProgressNote]: [
            "Subjective Assessment",
            "Objective Findings",
            "Assessment and Diagnosis",
            "Plan and Management",
            "Follow-up Instructions"
        ],
        [ReportType.AdmissionNote]: [
            "Reason for Admission",
            "History of Present Illness",
            "Past Medical History",
            "Physical Examination",
            "Laboratory and Imaging",
            "Assessment and Diagnosis",
            "Treatment Plan",
            "Disposition"
        ],
        [ReportType.OperativeNote]: [
            "Pre-operative Diagnosis",
            "Post-operative Diagnosis",
            "Procedure Performed",
            "Surgeon and Assistants",
            "Anesthesia Type",
            "Operative Findings",
            "Procedure Description",
            "Complications",
            "Post-operative Instructions"
        ],
        [ReportType.ProcedureNote]: [
            "Indication for Procedure",
            "Procedure Performed",
            "Patient Preparation",
            "Technique and Findings",
            "Complications",
            "Post-procedure Care",
            "Follow-up Plan"
        ],
        [ReportType.DischargeSummary]: [
            "Admission Diagnosis",
            "Discharge Diagnosis",
            "Hospital Course",
            "Procedures Performed",
            "Discharge Medications",
            "Follow-up Instructions",
            "Discharge Condition"
        ],
        [ReportType.DeathNote]: [
            "Time and Date of Death",
            "Cause of Death",
            "Clinical Course",
            "Resuscitation Efforts",
            "Family Notification",
            "Autopsy Recommendations"
        ],
        [ReportType.ReferralNote]: [
            "Reason for Referral",
            "Clinical History",
            "Current Medications",
            "Relevant Investigations",
            "Specific Questions",
            "Urgency Level"
        ]
    }

    // Function to get report type from URL or search params
    const getReportTypeFromUrl = (): ReportType => {
        const urlToReportType: Record<string, ReportType> = {
            "physical-examination": ReportType.PhysicalExamination,
            "history-taking": ReportType.HistoryTaking,
            "progress-note": ReportType.ProgressNote,
            "admission-note": ReportType.AdmissionNote,
            "operative-note": ReportType.OperativeNote,
            "procedure-note": ReportType.ProcedureNote,
            "discharge-summary": ReportType.DischargeSummary,
            "death-note": ReportType.DeathNote,
            "referral-note": ReportType.ReferralNote
        }

        for (const [urlSegment, reportType] of Object.entries(urlToReportType)) {
            if (pathname.includes(urlSegment)) {
                return reportType
            }
        }

        const typeParam = searchParams.get("type")
        if (typeParam && Object.values(ReportType).includes(typeParam as ReportType)) {
            return typeParam as ReportType
        }

        return ReportType.PhysicalExamination
    }

    // Function to format report type for display
    const formatReportType = (type: ReportType) => {
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }

    const currentReportType = getReportTypeFromUrl()
    const currentStructure = reportStructures[currentReportType] || []

    const setupAudio = async (): Promise<MediaRecorder | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1 }
            })

            stream.getTracks().forEach(track => {
                track.onended = () => {
                    setMediaRecorder(null)
                    setAudioContext(null)
                    streamRef.current = null
                    setCommands({ isRecording: false, isPaused: false, isEnded: true, isReset: true })
                    resetTimer()
                    const ctx = canvasRef.current?.getContext("2d")
                    ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
                }
            })

            streamRef.current = stream
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 2048

            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)
            analyserRef.current = analyser
            setAudioContext(audioCtx)

            const recorder = new MediaRecorder(stream, {
                mimeType: preferredMimeType,
                audioBitsPerSecond: 128000
            })
            setMediaRecorder(recorder)
            return recorder
        } catch (err) {
            console.error("Microphone access failed:", err)
            return null
        }
    }

    useEffect(() => {
        if (typeof window !== "undefined" && "MediaRecorder" in window) {
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                setPreferredMimeType("audio/webm;codecs=opus")
            } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
                setPreferredMimeType("audio/ogg;codecs=opus")
            } else {
                setPreferredMimeType("audio/webm")
            }
        }
        clearAudioBlob()
    }, [])

    useEffect(() => {
        // This effect is now only for cleanup on unmount.
        return () => {
            animationFrameRef.current && cancelAnimationFrame(animationFrameRef.current)
            streamRef.current?.getTracks().forEach(track => track.stop())
            clearAudioBlob()
        }
    }, [])

    const visualize = () => {
        const canvas = canvasRef.current
        const analyser = analyserRef.current
        if (!canvas || !analyser) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const bufferLength = analyser.fftSize
        const dataArray = new Uint8Array(bufferLength)
        const draw = () => {
            analyser.getByteTimeDomainData(dataArray)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.lineWidth = 2
            ctx.strokeStyle = "#9DA4AE"
            ctx.beginPath()
            const sliceWidth = canvas.width / bufferLength
            let x = 0
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = (v * canvas.height) / 2
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
                x += sliceWidth
            }
            ctx.lineTo(canvas.width, canvas.height / 2)
            ctx.stroke()
            animationFrameRef.current = requestAnimationFrame(draw)
        }
        draw()
    }

    const startRecording = async () => {
        let reportIdVar: string | undefined

        if (commands.isRecording || !readyToRecord) return

        let recorder = mediaRecorder
        if (!recorder) {
            recorder = await setupAudio()
            if (!recorder) {
                setShowMicPermissionModal(true)
                return
            }
        }

        let finalReportId: string | undefined = undefined
        // Set up the data handler regardless of whether this is a new or existing recorder
        recorder.ondataavailable = async e => {
            if (!e.data || e.data.size === 0) return

            // if (e.data.size < 10240) {
            //     console.log("Skipping chunk too small:", e.data.size, "bytes")
            //     return
            // }

            // HANDLE CASE WHERE USER HITS SUBMIT BEFORE ANY CHUNKS SENT (keep, refactor later)
            if ((recorder as any).__isFinalizing === true && !reportIdVar) {
                const blob = new Blob([e.data])
                setAudioBlob(blob)
                setStep(1)
                // const newPath = `/dashboard/acc${getPathFromReportType(currentReportType)}/${finalReportId}`
                // console.log("NAVIGATION PATH:", newPath)
                // window.history.replaceState({}, '', newPath)
                return
            }

            //FIRST CHUNK (refactor data into store)
            if (!reportIdVar) {
                if (currentReportType === ReportType.HistoryTaking) {
                    console.log("[HT] FIRST CHUNK: creating report on history endpoint… size:", e.data.size)
                    const res = await uploadHistoryTakingChunk({
                        file: e.data,
                        lastChunk: false,
                        patientId: selectedPatient?.id
                    })
                    if (res.reportId) {
                        reportIdVar = res.reportId
                        finalReportId = reportIdVar
                        console.log("[HT] FIRST CHUNK: report created, id:", reportIdVar)
                    }
                    return
                } else {
                    console.log("[GEN] FIRST CHUNK: creating report on doctor endpoint… size:", e.data.size)
                    const res = await uploadReportChunk({
                        file: e.data,
                        reportType: currentReportType,
                        lastChunk: false,
                        patientId: selectedPatient?.id
                    })
                    if (res.reportId) {
                        reportIdVar = res.reportId
                        finalReportId = reportIdVar
                        console.log("[GEN] FIRST CHUNK: report created, id:", reportIdVar)
                    }
                    return
                }
            }

            //FINAL CHUNK (refactor, this should be moved to ReportResult.tsx)
            // RResult will handle all UI, this should only call required store functions
            if ((recorder as any).__isFinalizing === true && reportIdVar) {
                const blob = new Blob([e.data])
                setAudioBlob(blob)
                setStep(1)
                const newPath = `/dashboard/acc${getPathFromReportType(currentReportType)}/${finalReportId}`
                console.log("NAVIGATION PATH:", newPath)
                window.history.replaceState({}, "", newPath)
                return
            }

            //MIDDLE CHUNKS (this can remain)
            if (currentReportType === ReportType.HistoryTaking) {
                console.log("[HT] MIDDLE CHUNK: sending chunk with reportId:", reportIdVar, "size:", e.data.size)
                await uploadHistoryTakingChunk({
                    file: e.data,
                    reportId: reportIdVar,
                    lastChunk: false,
                    patientId: selectedPatient?.id
                })
                console.log("[HT] MIDDLE CHUNK: chunk sent successfully for reportId:", reportIdVar)
                return
            } else {
                console.log("[GEN] MIDDLE CHUNK: sending chunk for report:", reportIdVar, "size:", e.data.size)
                await uploadReportChunk({
                    file: e.data,
                    reportType: currentReportType,
                    reportId: reportIdVar,
                    lastChunk: false,
                    patientId: selectedPatient?.id
                })
                console.log("[GEN] MIDDLE CHUNK: chunk sent successfully for reportId:", reportIdVar)
                return
            }
        }

        const chunkTimer = setInterval(() => {
            if (recorder.state === "recording" && !(recorder as any).__isFinalizing) {
                recorder.stop()
                setTimeout(() => {
                    if (recorder.state === "inactive" && !(recorder as any).__isFinalizing) {
                        recorder.start(30000)
                    }
                }, 100)
            }
        }, 30000)

        ;(recorder as any).__chunkTimer = chunkTimer

        // Start recording immediately
        if (recorder.state === "paused") {
            recorder.resume()
        } else if (recorder.state === "inactive") {
            recorder.start(30000)
        }

        // Update state and start visualization
        setCommands({ isRecording: true, isEnded: false, isPaused: false, isReset: false })

        // Ensure audio context is resumed and start visualization
        if (audioContext) {
            audioContext.resume().then(() => {
                visualize()
            })
        } else {
            // If audioContext is not ready yet, start visualization anyway
            visualize()
        }
    }

    const pauseRecording = () => {
        mediaRecorder?.pause()
        setCommands(prev => ({ ...prev, isRecording: false, isPaused: true }))
        animationFrameRef.current && cancelAnimationFrame(animationFrameRef.current)
    }

    const stopRecording = () => {
        if (mediaRecorder?.state === "recording" || mediaRecorder?.state === "paused") {
            // Clear the chunk timer first
            if ((mediaRecorder as any).__chunkTimer) {
                clearInterval((mediaRecorder as any).__chunkTimer)
            }

            // Set finalizing flag
            ;(mediaRecorder as any).__isFinalizing = true

            // Force stop to trigger ondataavailable with whatever audio has been recorded
            mediaRecorder.stop()
        }

        streamRef.current?.getTracks().forEach(track => track.stop())
        setCommands({ isEnded: true, isPaused: false, isRecording: false, isReset: false })
    }

    const resetRecording = async () => {
        setReadyToRecord(false)

        // Stop visualization animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        // Stop the media recorder if it's active and remove the event listener to prevent race conditions
        if (mediaRecorder) {
            if (mediaRecorder.state !== "inactive") {
                mediaRecorder.stop()
            }
            mediaRecorder.ondataavailable = null

            if ((mediaRecorder as any).__chunkTimer) {
                clearInterval((mediaRecorder as any).__chunkTimer)
            }
        }

        // Stop the media stream tracks to release the microphone
        streamRef.current?.getTracks().forEach(track => track.stop())

        // Wait a bit to ensure everything is cleaned up
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Reset all audio and component state to their initial values
        resetTimer()
        setAudioChunks([])
        clearAudioBlob()
        setMediaRecorder(null)
        setAudioContext(null)
        streamRef.current = null

        setCommands({ isReset: true, isRecording: false, isEnded: true, isPaused: false })

        // Clear the canvas
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        setReadyToRecord(true)
    }

    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    const isRecordingActive = commands.isRecording || commands.isPaused || (timeElapsed > 0 && !commands.isEnded)

    return (
        <motion.main
            initial="hidden"
            animate="visible"
            variants={fadeAnimation}
            exit="hidden"
            className="w-full max-w-[550px] flex flex-col items-center justify-center mx-auto py-5 overflow-visible h-[calc(100%)] se:h-auto se:overflow-visible relative">
            {showMicPermissionModal && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="bg-gray-100 rounded-xl p-8 w-96 text-center shadow-2xl border border-gray-200">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Microphone Access Required</h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            We need access to your microphone to record audio. Please allow microphone access in your
                            browser settings and try again.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowMicPermissionModal(false)}
                                className="px-6 py-3 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-100 transition-colors border border-gray-300">
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowMicPermissionModal(false)
                                    startRecording()
                                }}
                                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*{isProcessing && <LoadingModal />}*/}
            {isRecordingActive ? (
                <div className="bg-white mt-3 rounded-[25px] p-4 flex flex-col w-full h-[95%] se:h-auto">
                    {/* Top Section - Report Structure Guide (60%) */}
                    <div className="h-[60%] flex flex-col mb-4 se:h-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold">{formatReportType(currentReportType)}</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 relative block">
                                    <Image
                                        src={commands.isRecording ? Recording : StoppedRecording}
                                        fill
                                        alt="Recording status"
                                    />
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto se:max-h-[200px]">
                            <h3 className="text-sm font-semibold text-gray-600 mb-3">Report Structure Guide:</h3>
                            <div className="space-y-2">
                                {currentStructure.map((section, index) => (
                                    <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm text-gray-700 font-medium">{section}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - Original Recording Interface (40%) */}
                    <div className="h-[30%] flex flex-col justify-center items-center border-t pt-4 se:h-auto">
                        <div className="flex items-center justify-center gap-[4px] mb-2">
                            {/*<span className="w-6 h-4 relative block">*/}
                            {/*    <Image*/}
                            {/*        src={commands.isRecording ? Recording : StoppedRecording}*/}
                            {/*        fill*/}
                            {/*        alt="Recording status"*/}
                            {/*    />*/}
                            {/*</span>*/}
                            {/*{commands.isRecording ? (*/}
                            {/*    <p>Recording <span className="font-bold opacity-80"></span></p>*/}
                            {/*) : (*/}
                            {/*    <p>Recording with <span className="font-bold opacity-80"></span> paused</p>*/}
                            {/*)}*/}
                        </div>

                        <h3
                            className={`text-3xl font-bold mb-1 ${!commands.isRecording && timeElapsed > 0 && "text-[#9DA4AE]"}`}>
                            {padNumber(time.hours)}:{padNumber(time.minutes)}:
                            <span className="text-[#9DA4AE]">{padNumber(time.seconds)}</span>
                        </h3>

                        <div className="mb-4 h-8 w-full md:w-[350px] flex flex-col justify-center">
                            <canvas
                                ref={canvasRef}
                                width={350}
                                height={50}
                                className="w-full overflow-hidden block text-[#9DA4AE]"
                            />
                        </div>

                        <div className="w-auto gap-4 flex items-center justify-between">
                            <button
                                onClick={resetRecording}
                                disabled={!readyToRecord}
                                className="w-full px-3 text-[#475569] text-sm font-bold flex rounded-[7px] py-[6px] items-center bg-[#F1F5F9] justify-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed">
                                <AiOutlineReload />
                                Reset
                            </button>
                            <button
                                onClick={commands.isRecording ? pauseRecording : startRecording}
                                disabled={!readyToRecord}
                                className="w-full px-3 text-[#00549E] text-sm font-bold flex rounded-[10px] py-[12px] items-center bg-[#3CA2FB]/30 justify-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed">
                                {commands.isRecording ? (
                                    <CgPlayPauseR className="text-xl" />
                                ) : (
                                    <IoPlayOutline className="text-xl" />
                                )}{" "}
                                {commands.isRecording ? "Pause" : timeElapsed === 0 ? "Start" : "Resume"}
                            </button>
                            <button
                                onClick={stopRecording}
                                disabled={timeElapsed < 3}
                                className={`w-full px-3 text-sm font-bold flex rounded-[7px] py-[6px] items-center justify-center gap-[2px] ${
                                    timeElapsed >= 3
                                        ? "text-[#16A34A] bg-[#DCFCE7] hover:bg-[#BBF7D0]"
                                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                }`}>
                                <BsCheck className="text-xl" />
                                Submit
                            </button>
                        </div>
                        {/*<p className="text-[#8C96A5] text-xs mt-2 text-center">*/}
                        {/*    Recording {formatReportType(currentReportType)} - Follow the structure above*/}
                        {/*</p>*/}
                    </div>
                </div>
            ) : (
                /* Initial/Pre-Recording View */
                <div className="bg-white mt-3 rounded-[25px] p-4 flex items-center justify-center flex-col w-full">
                    <h2 className="text-xl font-bold text-center">{formatReportType(currentReportType)}</h2>
                    <div className="w-full mt-8 flex items-center justify-center flex-col">
                        <div className="flex items-center justify-center gap-[4px]">
                            <span className="w-6 h-4 relative block">
                                <Image src={StartRecording} fill alt="Recording status" />
                            </span>
                            <p>Ready to record</p>
                        </div>

                        <h3 className="text-6xl font-bold mt-2">
                            {padNumber(time.hours)}:{padNumber(time.minutes)}:
                            <span className="text-[#9DA4AE]">{padNumber(time.seconds)}</span>
                        </h3>

                        <div className="my-10 h-10 w-full md:w-[450px] flex flex-col justify-center">
                            <canvas
                                ref={canvasRef}
                                width={450}
                                height={50}
                                className="w-full overflow-hidden block text-[#9DA4AE]"
                            />
                        </div>

                        <button
                            onClick={startRecording}
                            disabled={!readyToRecord}
                            className="w-20 mt-2 h-20 text-white record-btn rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                            Record
                        </button>

                        <p className="text-[#8C96A5] text-sm mt-4 text-center">
                            This recording will be submitted as a {formatReportType(currentReportType)}
                        </p>

                        <div className="mt-3 mb-2 w-full flex flex-col sm:flex-row items-center justify-center">
                            <PatientSelector
                                selectedPatient={selectedPatient}
                                onPatientSelect={patient => {
                                    setSelectedPatient(patient)
                                }}
                                onPatientClear={() => {
                                    clearSelectedPatient()
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </motion.main>
    )
}

export default RecordReport

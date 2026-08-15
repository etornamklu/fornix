import React, { useEffect, useRef, useState } from "react"
import { LuMic } from "react-icons/lu"
import { CgPlayPauseR } from "react-icons/cg"
import { AiOutlineReload } from "react-icons/ai"
import { IoPlayOutline } from "react-icons/io5"
import { FaCheck } from "react-icons/fa"
import WaveSurfer from "wavesurfer.js"
import RecordPlugin from "wavesurfer.js/dist/plugins/record"
import { useVoiceNoteStore } from "../../../../store/VoiceNoteStore"

interface VoiceRecorderProps {
    onVoiceRecorded: (blob: Blob) => void
    onRecordingStart?: () => void
    onRecordingStop?: () => void
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onVoiceRecorded, onRecordingStart, onRecordingStop }) => {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const recordRef = useRef<RecordPlugin | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const recordingTimeRef = useRef(0)

    const shouldSubmitRef = useRef(false)

    const { setAudioBlob, setAudioUrl, setRecordingDuration, resetVoiceNote } = useVoiceNoteStore()

    useEffect(() => {
        if (isRecording) {
            const waveformContainer = document.getElementById("voice-waveform-container")
            if (waveformContainer) {
                wavesurferRef.current = WaveSurfer.create({
                    container: waveformContainer,
                    waveColor: "#4F46E5",
                    progressColor: "#818CF8",
                    cursorColor: "transparent",
                    barWidth: 3,
                    barGap: 3,
                    barRadius: 3,
                    height: 32,
                    normalize: true
                })

                recordRef.current = wavesurferRef.current.registerPlugin(
                    RecordPlugin.create({
                        scrollingWaveform: true,
                        renderRecordedAudio: true
                    })
                )

                recordRef.current.on("record-end", blob => {
                    console.log("🔚 record-end event fired, blob:")
                    if (blob) {
                        const audioUrl = URL.createObjectURL(blob)
                        setAudioBlob(blob)
                        setAudioUrl(audioUrl)
                        setRecordingDuration(recordingTimeRef.current)
                        if (shouldSubmitRef.current) {
                            onVoiceRecorded(blob)
                        }
                    } else {
                        console.log("❌ No blob received")
                    }
                })

                // Start recording
                recordRef.current.startRecording().catch(error => {
                    console.error("❌ Error starting recording:", error)
                    setIsRecording(false)
                    alert("Could not access microphone. Please check permissions.")
                })
            }
        }

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy()
            }
        }
    }, [isRecording, onVoiceRecorded, setAudioBlob, setAudioUrl, setRecordingDuration])

    // This effect handles the timer
    useEffect(() => {
        let timerInterval: NodeJS.Timeout | null = null
        if (isRecording && !isPaused) {
            timerInterval = setInterval(() => {
                setRecordingTime(prevTime => {
                    const newTime = prevTime + 1
                    recordingTimeRef.current = newTime
                    return newTime
                })
            }, 1000)
        }
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval)
            }
        }
    }, [isRecording, isPaused])

    // Effect to reset the timer display when recording stops
    useEffect(() => {
        if (!isRecording) {
            setRecordingTime(0)
            recordingTimeRef.current = 0
        }
    }, [isRecording])

    // Format seconds to MM:SS
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    // Pause recording function
    const pauseRecording = async () => {
        try {
            if (recordRef.current) {
                await recordRef.current.pauseRecording()
            }
            setIsPaused(true)
            console.log("⏸️ Recording paused")
        } catch (error) {
            console.error("Error pausing recording:", error)
        }
    }

    // Resume recording function
    const resumeRecording = async () => {
        try {
            if (recordRef.current) {
                await recordRef.current.resumeRecording()
            }
            setIsPaused(false)
            console.log("▶️ Recording resumed")
        } catch (error) {
            console.error("Error resuming recording:", error)
        }
    }

    // Reset recording function
    const resetRecording = async () => {
        try {
            shouldSubmitRef.current = false
            if (recordRef.current) {
                await recordRef.current.stopRecording()
            }
            setIsRecording(false)
            setIsPaused(false)
            setRecordingTime(0)
            recordingTimeRef.current = 0
            resetVoiceNote()
            onRecordingStop?.()
            console.log("🔄 Recording reset")
        } catch (error) {
            console.error("Error resetting recording:", error)
            setIsRecording(false)
            setIsPaused(false)
            setRecordingTime(0)
            recordingTimeRef.current = 0
        }
    }

    // Stop recording function
    const stopRecording = async () => {
        try {
            shouldSubmitRef.current = true
            if (recordRef.current) {
                await recordRef.current.stopRecording()
            }
            setIsRecording(false)
            setIsPaused(false)
            onRecordingStop?.()
        } catch (error) {
            console.error("Error stopping recording:", error)
            setIsRecording(false)
            setIsPaused(false)
            onRecordingStop?.()
        }
    }

    // Toggle recording function
    const toggleRecording = async () => {
        console.log("🎤 toggleRecording called, isRecording:", isRecording)
        if (isRecording) {
            console.log("🛑 Stopping recording...")
            await stopRecording()
        } else {
            console.log("▶️ Starting recording...")
            resetVoiceNote()
            setIsRecording(true)
            setIsPaused(false)
            onRecordingStart?.()
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            {!isRecording ? (
                // Start recording button
                <button
                    className="bg-blue-500 w-11 h-11 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                    onClick={() => {
                        console.log("🔴 START BUTTON CLICKED!")
                        toggleRecording()
                    }}
                    aria-label="Start recording">
                    <LuMic className="text-white" size={23} />
                </button>
            ) : (
                // Recording controls using ACC report button layout
                <div className="flex gap-2 sm:gap-4 items-center justify-center w-full">
                    {/* Reset button */}
                    <button
                        className="px-2 sm:px-3 text-[#475569] text-sm font-bold flex rounded-[7px] py-[6px] items-center bg-[#F1F5F9] justify-center gap-1 sm:gap-[6px]"
                        onClick={resetRecording}>
                        <AiOutlineReload className="text-xl" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>

                    {/* Pause/Resume button */}
                    <button
                        className="px-2 sm:px-3 text-[#00549E] text-sm font-bold flex rounded-[7px] py-[6px] items-center bg-[#D9E8FF] justify-center gap-1 sm:gap-[6px]"
                        onClick={isPaused ? resumeRecording : pauseRecording}>
                        {isPaused ? <IoPlayOutline className="text-xl" /> : <CgPlayPauseR className="text-xl" />}
                        <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
                    </button>

                    {/* Submit button */}
                    <button
                        className="px-2 sm:px-3 text-[#059669] text-sm font-bold flex rounded-[7px] py-[6px] items-center bg-[#E6FAE6] justify-center gap-1 sm:gap-[6px]"
                        onClick={() => {
                            console.log("📤 SUBMIT BUTTON CLICKED!")
                            stopRecording()
                        }}>
                        <FaCheck className="text-xl" />
                        <span className="hidden sm:inline">Submit</span>
                    </button>
                </div>
            )}
        </div>
    )
}

import React, { useEffect, useRef, useState } from "react"
import { BiStop } from "react-icons/bi"
import { LuMic, LuSendHorizontal } from "react-icons/lu"
import WaveSurfer from "wavesurfer.js"
import RecordPlugin from "wavesurfer.js/dist/plugins/record"
import { useVoiceNoteStore } from "../../../../store/VoiceNoteStore"

interface ChatMessageSendProps {
    input: string
    answerQuestion: () => void
    isRecording: boolean
    setIsRecording: (isRecording: boolean) => void
    onVoiceNoteRecorded?: (blob: Blob) => void
}

export const ChatMessageSend: React.FC<ChatMessageSendProps> = ({
    input,
    answerQuestion,
    isRecording,
    setIsRecording,
    onVoiceNoteRecorded
}) => {
    const [recordingTime, setRecordingTime] = useState(0)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const recordRef = useRef<RecordPlugin | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const { setAudioBlob, audioUrl, setAudioUrl, setRecordingDuration, resetVoiceNote } = useVoiceNoteStore()

    // Initialize WaveSurfer and Record plugin
    useEffect(() => {
        if (isRecording) {
            // Find the waveform container in the parent component
            const waveformContainer = document.getElementById("waveform-container")

            if (waveformContainer) {
                // Create WaveSurfer instance
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

                // Create Record plugin
                recordRef.current = wavesurferRef.current.registerPlugin(
                    RecordPlugin.create({
                        scrollingWaveform: true,
                        renderRecordedAudio: true
                    })
                )

                // Start recording
                recordRef.current.startRecording().catch(error => {
                    console.error("Error starting recording:", error)
                    stopRecording()
                    alert("Could not access microphone. Please check permissions.")
                })

                // Set up event listeners
                if (recordRef.current) {
                    recordRef.current.on("record-end", blob => {
                        stopTimer()

                        // Save recording to store
                        if (blob) {
                            const audioUrl = URL.createObjectURL(blob)
                            setAudioBlob(blob)
                            setAudioUrl(audioUrl)
                            setRecordingDuration(recordingTime)

                            // Call the callback if provided
                            if (onVoiceNoteRecorded) {
                                onVoiceNoteRecorded(blob)
                            }
                        }
                    })
                }

                // Start timer
                startTimer()
            }
        }

        // Cleanup function
        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy()
            }
            stopTimer()
        }
    }, [isRecording])

    // Timer functions for recording duration
    const startTimer = () => {
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
            setRecordingTime(prevTime => prevTime + 1)
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    // Format seconds to MM:SS
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    // Stop recording function
    const stopRecording = async () => {
        try {
            if (recordRef.current) {
                await recordRef.current.stopRecording()
            }
            setIsRecording(false)
            stopTimer()
        } catch (error) {
            console.error("Error stopping recording:", error)
            setIsRecording(false)
            stopTimer()
        }
    }

    // Toggle recording function
    const toggleRecording = async () => {
        if (isRecording) {
            await stopRecording()
        } else {
            resetVoiceNote()
            setIsRecording(true)
            // The actual recording starts in the useEffect when isRecording becomes true
        }
    }

    const shouldShowSendIcon = input.trim() !== "" || audioUrl

    // Handle button click
    const handleButtonClick = () => {
        if (shouldShowSendIcon) {
            answerQuestion()
            resetVoiceNote()
        } else {
            toggleRecording()
        }
    }

    return (
        <div className="flex flex-col items-center">
            <button
                className="blue-gradient w-11 h-11 rounded-lg flex items-center justify-center"
                onClick={handleButtonClick}
                aria-label={shouldShowSendIcon ? "Send message" : isRecording ? "Stop recording" : "Start recording"}>
                {shouldShowSendIcon ? (
                    <LuSendHorizontal className="text-white" size={23} />
                ) : isRecording ? (
                    <BiStop className="text-white" size={23} />
                ) : (
                    <LuMic className="text-white" size={23} />
                )}
            </button>
        </div>
    )
}

"use client"
import React, { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import WaveSurfer from "wavesurfer.js"
import { FiDownload } from "react-icons/fi"
import { BiPause, BiPlay } from "react-icons/bi"
import Markdown from "react-markdown"

import BotImage from "../../../../public/images/logo-primary.png"
import { useAudioMessagesStore } from "../../../../store/AudioMessagesStore"
import { downloadAudioMessage } from "@/services/dashboard/patient_history.service"
import { LuMic } from "react-icons/lu"
import LoadingDiagnosis from "@/components/dashboard/patient_diagnosis/generate_diagnosis/LoadingDiagnosis"

// Helper to convert a data URL string back into a Blob.
function dataURLToBlob(dataURL: string): Blob {
    const [header, base64Data] = dataURL.split(",")
    const mimeMatch = header.match(/:(.*?);/)
    if (!mimeMatch) {
        throw new Error("Invalid data URL")
    }
    const mime = mimeMatch[1]
    const binary = atob(base64Data)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i)
    }
    return new Blob([array], { type: mime })
}

export const getAudioMessage = async (audioMsgString: string, setIsDownloading: (value: boolean) => void) => {
    const prefix = "#!AUDIO_MSG:"
    const localPrefix = "#!AUDIO_MSG_LOCAL:"

    if (audioMsgString.startsWith(localPrefix)) {
        // For local audio messages, we don't need to download anything
        // Just return the ID since it's already in the store
        const audioId = audioMsgString.substring(localPrefix.length).trim()
        return { audioId, audioBlob: null } // audioBlob is null since it's already in store
    }

    if (!audioMsgString.startsWith(prefix)) {
        throw new Error("Invalid audio message format")
    }

    // Rest of the existing function for remote audio messages
    const audioId = audioMsgString.substring(prefix.length).trim()
    setIsDownloading(true)
    try {
        const audioBlob = await downloadAudioMessage(audioId)
        await useAudioMessagesStore.getState().addAudioMessage(audioId, audioBlob)
        return { audioId, audioBlob }
    } catch (error) {
        console.error("Error downloading audio message:", error)
        throw error
    } finally {
        setIsDownloading(false)
    }
}

export interface IConversation {
    question: string
    answer: string
}

export interface IConversationPair extends IConversation {
    userName: string
    loadingStream: boolean
}

const ConversationPair = ({ question, answer, userName, loadingStream }: IConversationPair) => {
    const userIcon = userName?.substring(0, 1)
    const [isDownloading, setIsDownloading] = useState(false)
    const waveSurferRef = useRef<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const waveformRef = useRef<HTMLDivElement>(null)
    const [audioDataReady, setAudioDataReady] = useState(false)
    const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null)
    const [audioLoaded, setAudioLoaded] = useState(false)

    // Create a unique ID for each waveform container
    const waveformContainerId = useRef<string>(`waveform-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`)

    // Flag to ensure client-only UI is rendered only after mount.
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const remotePrefix = "#!AUDIO_MSG:"
    const localPrefix = "#!AUDIO_MSG_LOCAL:"

    const isAudioMsg = answer && (answer.startsWith(remotePrefix) || answer.startsWith(localPrefix))
    const isLocalAudio = answer && answer.startsWith(localPrefix)

    let audioId = null
    if (isAudioMsg) {
        audioId = isLocalAudio
            ? answer.substring(localPrefix.length).trim()
            : answer.substring(remotePrefix.length).trim()
    }

    // Subscribe to the stored audio data URL from the zustand store
    const storedDataUrl = useAudioMessagesStore(state => (audioId ? state.audioMessages[audioId] : null))

    // For local audio, we should already have it in the store, so no need to download
    const audioNeedsDownload = isAudioMsg && !isLocalAudio && !storedDataUrl

    const wavesurferConfig = {
        waveColor: "#1b74c3",
        progressColor: "#0014ff",
        cursorColor: "transparent",
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 24,
        normalize: true
    }

    // Process audio data when it becomes available
    useEffect(() => {
        if (storedDataUrl && mounted) {
            try {
                // Clean up previous objectUrl if it exists
                if (audioObjectUrl) {
                    URL.revokeObjectURL(audioObjectUrl)
                }

                const blob = dataURLToBlob(storedDataUrl)
                const newObjectUrl = URL.createObjectURL(blob)
                setAudioObjectUrl(newObjectUrl)
                setAudioDataReady(true)
            } catch (error) {
                console.error("Error processing audio data:", error)
                setAudioDataReady(false)
            }
        }

        return () => {
            // Clean up the object URL when component unmounts or dependencies change
            if (audioObjectUrl) {
                URL.revokeObjectURL(audioObjectUrl)
                setAudioObjectUrl(null)
            }
        }
    }, [storedDataUrl, mounted])

    const initializeWaveSurfer = useCallback(() => {
        if (!document.getElementById(waveformContainerId.current) || !audioObjectUrl) {
            return null
        }

        // Clean up any existing WaveSurfer instance
        if (waveSurferRef.current) {
            waveSurferRef.current.destroy()
            waveSurferRef.current = null
        }

        const config = {
            container: `#${waveformContainerId.current}`,
            ...wavesurferConfig
        }

        try {
            const ws = WaveSurfer.create(config)

            ws.on("error", (err: any) => {
                console.error("WaveSurfer error:", err)
                setIsPlaying(false)
            })

            ws.on("ready", () => {
                console.log("WaveSurfer is ready")
                setAudioLoaded(true)
            })

            ws.on("play", () => {
                console.log("WaveSurfer play event")
                setIsPlaying(true)
            })

            ws.on("pause", () => {
                console.log("WaveSurfer pause event")
                setIsPlaying(false)
            })

            ws.on("finish", () => {
                console.log("WaveSurfer finish event")
                setIsPlaying(false)
                ws.seekTo(0) // Reset the waveform to the start position.
            })

            // Load the audio from the object URL
            try {
                console.log("Loading audio from URL:", audioObjectUrl)
                ws.load(audioObjectUrl)
            } catch (loadError) {
                console.error("Error during wavesurfer load:", loadError)
            }

            return ws
        } catch (error) {
            console.error("Error initializing WaveSurfer:", error)
            return null
        }
    }, [audioObjectUrl])

    // Effect for creating WaveSurfer instance after audio data is ready
    useEffect(() => {
        if (audioDataReady && audioObjectUrl && mounted) {
            // Allow DOM to fully render before initializing WaveSurfer
            const timer = setTimeout(() => {
                console.log("Initializing WaveSurfer...")
                const ws = initializeWaveSurfer()
                if (ws) {
                    console.log("WaveSurfer instance created")
                    waveSurferRef.current = ws
                }
            }, 100)

            return () => clearTimeout(timer)
        }

        // Cleanup on unmount
        return () => {
            if (waveSurferRef.current) {
                waveSurferRef.current.destroy()
                waveSurferRef.current = null
            }
        }
    }, [audioDataReady, audioObjectUrl, mounted, initializeWaveSurfer])

    const handleDownloadAudio = useCallback(async () => {
        if (!answer || isLocalAudio) return // Skip download for local audio

        try {
            await getAudioMessage(answer, setIsDownloading)
        } catch (error) {
            console.error("Audio download failed", error)
        }
    }, [answer, isLocalAudio])

    const handlePlay = () => {
        console.log("Play button clicked")
        if (waveSurferRef.current && audioLoaded) {
            console.log("Calling play on WaveSurfer instance")
            waveSurferRef.current.play()
        } else {
            console.warn("WaveSurfer instance or audio not ready:", { instance: !!waveSurferRef.current, audioLoaded })
        }
    }

    const handlePause = () => {
        console.log("Pause button clicked")
        if (waveSurferRef.current) {
            console.log("Calling pause on WaveSurfer instance")
            waveSurferRef.current.pause()
        }
    }

    return (
        <div className="w-full mb-8">
            {/* Question */}
            <div className="flex bot mb-8 justify-start items-end gap-3">
                <div className="w-10 h-10 rounded-full relative">
                    <Image src={BotImage} alt="Bot Image" fill />
                </div>
                <div className="inline max-w-[calc(100%-60px)] bg-white shadow-lg rounded-[16px] rounded-bl-[0px] border-[1px] p-4">
                    {question ? (
                        <div className="text-[#475569] text-sm whitespace-pre-wrap break-words">
                            <Markdown>{question}</Markdown>
                            {loadingStream && (
                                <div className="flex w-6 max-w-1/3 p-1">
                                    <LoadingDiagnosis loadingText={""} size={15} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs">
                            <LoadingDiagnosis loadingText={""} size={15} />
                        </div>
                    )}
                </div>
            </div>

            {/* Answer */}
            {answer && (
                <div className="flex user relative mb-8 justify-end items-end gap-3">
                    {/* Answer with audio message */}
                    {isAudioMsg ? (
                        <div className="w-full max-w-[calc(100%-60px)] md:max-w-[calc(80%-60px)] flex items-center justify-end">
                            <div className="border bg-white shadow rounded-lg rounded-br-none flex items-center h-11 w-3/5 p-2">
                                <div className="w-8 h-8 blue-gradient text-white rounded-full flex justify-center items-center">
                                    <LuMic size={20} />
                                </div>
                                <div className="flex-1">
                                    {mounted ? (
                                        storedDataUrl ? (
                                            // Show waveform with play/pause controls
                                            <div className="flex justify-between items-center">
                                                {isPlaying ? (
                                                    <button
                                                        onClick={handlePause}
                                                        className="p-2 text-blue-600"
                                                        aria-label="Pause">
                                                        <BiPause size={25} fill="url(#blueGradient)" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handlePlay}
                                                        className="p-2 text-blue-600"
                                                        aria-label="Play">
                                                        <BiPlay size={25} fill="url(#blueGradient)" />
                                                    </button>
                                                )}
                                                <div id={waveformContainerId.current} className="w-full h-6" />
                                            </div>
                                        ) : isDownloading ? (
                                            // Show loading spinner while downloading
                                            <div className="flex items-center p-2">
                                                <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                            </div>
                                        ) : // Only show download button for remote audio that needs downloading
                                        audioNeedsDownload ? (
                                            <button
                                                onClick={handleDownloadAudio}
                                                className="flex items-center justify-between gap-2 p-2 text-blue-500 w-full">
                                                <FiDownload size={18} />
                                                <div className="flex-1 h-[1px] w-full blue-gradient" />
                                            </button>
                                        ) : (
                                            // Fallback for any other case - should rarely happen
                                            <div className="flex items-center p-2">
                                                <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                            </div>
                                        )
                                    ) : (
                                        // Initial render state
                                        <button
                                            onClick={handleDownloadAudio}
                                            className="flex items-center justify-between gap-2 p-2 text-blue-500 w-full">
                                            <FiDownload size={18} />
                                            <div className="flex-1 h-[1px] w-full blue-gradient" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Normal text answer.
                        <div className="inline max-w-[calc(100%-60px)] md:max-w-[calc(80%-60px)] blue-gradient text-white shadow-lg rounded-[16px] rounded-br-[0px] border-[1px] p-4">
                            <div className="text-white text-sm">
                                <p className="break-words text-[13px]">{answer}</p>
                            </div>
                        </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-xl relative">
                        <div className="text-blue-500 font-bold">{userIcon}</div>
                    </div>
                </div>
            )}
            {/* SVG Gradient Definition for icons */}
            <svg width="0" height="0" className="hidden">
                <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1b74c3" />
                        <stop offset="100%" stopColor="#0014ff" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}

export default ConversationPair

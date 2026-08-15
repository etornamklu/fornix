import { DoctorsGptRequestProps, MedFindMessage } from "@/utils/types"
import { useEffect, useMemo, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { MessageAvatar } from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import styles from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import { IoTimeOutline } from "react-icons/io5"
import { BiPause, BiPlay } from "react-icons/bi"
import { LuMic } from "react-icons/lu"
import { useAudioMessagesStore } from "../../../../store/AudioMessagesStore"
import { downloadAnyAudio } from "@/services/dashboard/patientgpt.service"

export const SendMessage = ({
    request,
    chatMessage
}: {
    request?: DoctorsGptRequestProps
    chatMessage?: MedFindMessage
}) => {
    const [fullHeight, setFullHeight] = useState(false)
    const [historyAudioBlob, setHistoryAudioBlob] = useState<Blob | null>(null)
    const [historyAudioLoading, setHistoryAudioLoading] = useState(false)

    // If this is a historical human message delivered via chatMessage, check for audio metadata
    useEffect(() => {
        const additional = (chatMessage?.data as any)?.additional_kwargs
        const inputType: string | undefined = additional?.input
        const audioId: string | undefined = additional?.audio_id
        let cancelled = false

        async function loadHistoryAudio() {
            if (!chatMessage || inputType !== "audio" || !audioId) {
                setHistoryAudioBlob(null)
                return
            }
            setHistoryAudioLoading(true)
            try {
                let blob = useAudioMessagesStore.getState().getAudioMessage(audioId)
                if (!blob) {
                    const downloaded = await downloadAnyAudio(audioId)
                    await useAudioMessagesStore.getState().addAudioMessage(audioId, downloaded)
                    blob = downloaded
                }
                if (!cancelled) setHistoryAudioBlob(blob)
            } finally {
                if (!cancelled) setHistoryAudioLoading(false)
            }
        }

        loadHistoryAudio().then()
        return () => {
            cancelled = true
        }
    }, [chatMessage])
    return (
        <div className="flex flex-col gap-2">
            <MessageAvatar user={"doctor"} />
            <div className={`pl-16 flex justify-end`}>
                {request?.audioBlob || historyAudioBlob ? (
                    // Render audio player without the message bubble wrapper
                    <MiniWavePlayerFromBlob blob={request?.audioBlob || historyAudioBlob!} />
                ) : (
                    <div
                        className={`flex h-full min-w-24 max-w-sm lg:max-w-2xl px-4 py-4 text-white rounded-xl ${
                            !fullHeight && "max-h-28"
                        } ${styles.sendMessage}`}
                        onClick={() => setFullHeight(!fullHeight)}>
                        <div className={`w-full py-1 overflow-hidden`}>
                            <p className={`${!fullHeight && styles.textOverflow}`}>
                                {request ? (
                                    request.content
                                ) : chatMessage ? (
                                    chatMessage.data.content
                                ) : (
                                    <IoTimeOutline size={20} />
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>
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

// Minimal inline WaveSurfer player fed by a Blob
const MiniWavePlayerFromBlob = ({ blob }: { blob: Blob }) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        if (!containerRef.current) return
        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#1b74c3",
            progressColor: "#00549E",
            cursorColor: "transparent",
            height: 24,
            barWidth: 2,
            barGap: 3,
            barRadius: 3,
            normalize: true
        })
        wavesurferRef.current = ws
        ws.on("play", () => setIsPlaying(true))
        ws.on("pause", () => setIsPlaying(false))
        ws.loadBlob(blob)
        return () => {
            ws.destroy()
        }
    }, [blob])

    return (
        <div className="border bg-white shadow rounded-lg rounded-br-none flex items-center h-11 w-3/5 p-2">
            <div className="w-8 h-8 blue-gradient text-white rounded-full flex justify-center items-center">
                <LuMic size={20} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    {isPlaying ? (
                        <button
                            onClick={() => wavesurferRef.current?.pause()}
                            className="p-2 text-blue-600"
                            aria-label="Pause">
                            <BiPause size={25} fill="url(#blueGradient)" />
                        </button>
                    ) : (
                        <button
                            onClick={() => wavesurferRef.current?.play()}
                            className="p-2 text-blue-600"
                            aria-label="Play">
                            <BiPlay size={25} fill="url(#blueGradient)" />
                        </button>
                    )}
                    <div ref={containerRef} className="w-full h-6" />
                </div>
            </div>
        </div>
    )
}

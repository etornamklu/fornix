import { DoctorGptResponse, MedFindMessage } from "@/utils/types"
import { useEffect, useMemo, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { gptResponseToJson, tempConvertChatMessageToStd } from "@/utils/dashboard/gpt"
import { MessageAvatar } from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import styles from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import { AddLineBreak } from "@/components/dashboard/AddLineBreak"
import { removeAsterisks } from "@/utils/dashboard/diagnosis"
import { LinkPreview } from "@/components/dashboard/doctors_gpt/LinkPreview"
import LoadingDiagnosis from "@/components/dashboard/patient_diagnosis/generate_diagnosis/LoadingDiagnosis"
import { useAudioMessagesStore } from "../../../../store/AudioMessagesStore"
import { downloadAnyAudio } from "@/services/dashboard/patientgpt.service"
import { downloadAudioMessage } from "@/services/dashboard/patient_history.service"
import { BiPause, BiPlay } from "react-icons/bi"
import { LuMic } from "react-icons/lu"

export const ReceiveMessage = ({
    response = "",
    chatMessage,
    handleAddRequest
}: {
    response?: string
    chatMessage?: MedFindMessage
    handleAddRequest?: (request: string) => void
}) => {
    const [fullHeight, setFullHeight] = useState(true)

    // let jsonResponse: DoctorGptResponse | string
    const [jsonResponse, setJsonResponse] = useState<DoctorGptResponse | string>(response)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioLoading, setAudioLoading] = useState<boolean>(false)

    useEffect(() => {
        if (chatMessage) setJsonResponse(tempConvertChatMessageToStd(chatMessage))
        else setJsonResponse(response ? gptResponseToJson(response) : "")
    }, [chatMessage, response])

    // Resolve a plain content string for inspection
    const contentString = useMemo(() => {
        if (chatMessage) return chatMessage.data.content ?? ""
        if (typeof jsonResponse === "string") return jsonResponse
        // @ts-ignore
        return (jsonResponse && (jsonResponse as any).response) || ""
    }, [chatMessage, jsonResponse])

    // Detect audio via additional_kwargs or legacy marker protocol
    const REMOTE_PREFIX = "#!AUDIO_MSG:"
    const LOCAL_PREFIX = "#!AUDIO_MSG_LOCAL:"
    const { input: inputType, audio_id: additionalAudioId } = (chatMessage?.data as any)?.additional_kwargs || {}
    const markerAudio =
        typeof contentString === "string" &&
        (contentString.startsWith(REMOTE_PREFIX) || contentString.startsWith(LOCAL_PREFIX))
            ? {
                  isLocal: contentString.startsWith(LOCAL_PREFIX),
                  id: contentString
                      .substring((contentString.startsWith(LOCAL_PREFIX) ? LOCAL_PREFIX : REMOTE_PREFIX).length)
                      .trim()
              }
            : null
    const isAudioMsg = Boolean((inputType === "audio" && additionalAudioId) || markerAudio)

    useEffect(() => {
        async function prepareAudio() {
            if (!isAudioMsg) {
                setAudioBlob(null)
                return
            }
            const isLocal = inputType === "audio" && additionalAudioId ? false : markerAudio?.isLocal
            const audioId = (inputType === "audio" && additionalAudioId) || markerAudio?.id
            try {
                setAudioLoading(true)
                let blob = audioId ? useAudioMessagesStore.getState().getAudioMessage(audioId) : null
                if (!blob && !isLocal) {
                    if (audioId) {
                        // Try generic download first (covers MedFind/doctor chat)
                        let downloaded: Blob
                        try {
                            downloaded = await downloadAnyAudio(audioId)
                        } catch (e) {
                            // Fallback to patient-specific if backend happens to store it there
                            downloaded = await downloadAudioMessage(audioId)
                        }
                        await useAudioMessagesStore.getState().addAudioMessage(audioId, downloaded)
                        blob = downloaded
                    }
                }
                setAudioBlob(blob ?? null)
            } finally {
                setAudioLoading(false)
            }
        }
        prepareAudio().then()
    }, [contentString, isAudioMsg, inputType, additionalAudioId])

    return (
        <div className="flex flex-col gap-2 w-full">
            <MessageAvatar user={"fornix"} />
            <div className={`pr-3 sm:pr-8 lg:min-w-full xl:min-w-[42rem]`}>
                {isAudioMsg ? (
                    audioLoading ? (
                        <LoadingDiagnosis loadingText="Loading audio..." />
                    ) : audioBlob ? (
                        <MiniWavePlayerFromBlob blob={audioBlob} />
                    ) : (
                        <AddLineBreak text="Audio unavailable." />
                    )
                ) : (
                    <div
                        className={`flex h-full w-full px-4 py-4 text-black rounded-xl ${
                            !fullHeight && "max-h-28"
                        } bg-white ${styles.receiveMessage}`}>
                        <div className={`w-full py-1 overflow-hidden`}>
                            <div className={`${!fullHeight && styles.textOverflow}`}>
                                {response || jsonResponse ? (
                                    typeof jsonResponse === "string" ? (
                                        jsonResponse.length ? (
                                            <AddLineBreak text={jsonResponse} />
                                        ) : (
                                            <AddLineBreak text={response ?? ""} />
                                        )
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <AddLineBreak text={jsonResponse} />
                                            </div>

                                            {jsonResponse.related_questions && (
                                                <div>
                                                    <div className="h-[1px] w-full bg-gray-300 mb-10" />
                                                    <span className="font-semibold">Related questions:</span>

                                                    <div className="flex flex-col gap-3">
                                                        {jsonResponse.related_questions.map((question, i) => (
                                                            <button
                                                                key={i}
                                                                className="text-sm w-full py-1 px-2 rounded-3xl hover:shadow-lg
                                                            border border-gray-200 hover:bg-blue-500 hover:text-white
                                                            transition duration-300 text-gray-700"
                                                                onClick={() => {
                                                                    handleAddRequest && handleAddRequest(question)
                                                                }}>
                                                                {question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <LoadingDiagnosis loadingText="Analyzing query..." />
                                )}
                            </div>
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

// Minimal inline WaveSurfer player fed by an object URL (already created)
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

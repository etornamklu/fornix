"use client"
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"

import ConversationPair from "./ConversationPair"
import { BACKEND_BASE_URL } from "@/utils/constants"
// import { LuSendHorizontal } from "react-icons/lu"
import { getBearerToken, getUserData } from "@/utils/auth.server"
import { v4 as uuidv4 } from "uuid"
// import NetworkStatusAlert from "./networkStatus";
import ErrorOnRequest from "./ErrorOnRequest"
import { useQuestionnaireHistoryStore } from "../../../../store/questionaireHistoryStore"
import { AuthType, DashboardPath, LogoVariants } from "@/utils/types"
import { QuestionnaireCompleteModal } from "@/components/patients/QuestionnaireCompleteModal"
import { updateUserPaymentInfo } from "@/services/payment/payment.service"
import useAuthEffect from "@/utils/hooks/useAuthEffect"
import useAuthStore from "../../../../store/AuthStore"
import { useRouter } from "next/navigation"
import { ChatMessageSend } from "@/components/patients/condition/ChatMessageSend"
import { BiPause, BiPlay, BiTrash } from "react-icons/bi"
import { useVoiceNoteStore } from "../../../../store/VoiceNoteStore"
import WaveSurfer from "wavesurfer.js"
import { uploadVoiceNote } from "@/services/dashboard/ai_patient.service"
import { useAudioMessagesStore } from "../../../../store/AudioMessagesStore"
import { LogoAsset } from "@/components/assets/LogoAsset"

export interface IConversation {
    question: string
    answer: string
}

const ConditionHome = ({ auth, setShowHome }: { auth: AuthType; setShowHome: Dispatch<SetStateAction<boolean>> }) => {
    return (
        <div className="w-full h-[calc(100vh-90px)] md:h-[80vh] flex flex-col items-center justify-center gap-3">
            <div className="flex justify-center items-center h-20 w-20 relative">
                {/*<Image src={BotImage} fill alt="Bot Image" />*/}
                <LogoAsset size={50} title={false} variant={LogoVariants.primary} />
            </div>
            <p className="py-2 rounded-full px-4 md-4 bg-white shadow-xl text-sm font-semibold border-[1px]">
                Fornix Here, Welcome
            </p>

            <h1 className="text-5xl font-bold text-gray-400 my-2 text-center">
                Hi, <span className="text-black text-center">{auth.name}</span>
            </h1>

            <p className="text-gray-500 md:w-1/2 text-center whitespace-pre-wrap">
                {`Fornix AI is here to take a deep dive into your medical history—because the details matter. It might take a little time, but trust us, it’s worth it.\n\nStick with us, and by the end, you'll have a complete, structured report ready to share with your clinician for a smoother, smarter consultation!`}
            </p>

            {/*<p className="text-gray-500 md:w-1/2 text-center">Please take some time to fill in these questions. </p>*/}

            <button
                className="blue-gradient px-12 md:px-6 font-bold mt-6 py-3 md:py-2 rounded-[10px] md:rounded-full text-white"
                onClick={() => {
                    setShowHome(false)
                }}>
                Let&apos;s begin
            </button>
        </div>
    )
}

const Condition = () => {
    const [showHome, setShowHome] = useState(true)

    const [input, setInput] = useState("")
    const [textareaHeight, setTextareaHeight] = useState("50px")
    const [patient, setPatient] = useState<any>("")
    const [isRecording, setIsRecording] = useState(false)

    const containerRef = useRef<any>(null)
    const scrollRef = useRef<any>(null)
    const [conversations, setConversations] = useState<IConversation[] | null>(null)
    const [sessionId, setSessionId] = useState("")
    const [error, setError] = useState<string | null>(null)
    const staticQuestion = `Hello! I'm Fornix AI, your doctor's assistant. To help your clinician understand your condition better, I'd like to ask a few questions about your symptoms and medical history.\n\nThis will make your consultation smoother and more efficient. You can stop at any time, and if anything is unclear, feel free to ask me for clarification.\n\nDo I have your permission to continue?`

    const endChatMessageNonFormatted = "Thankyouforyourtime.Allyourresponseshavebeenrecorded.Goodbye."
    const endChatMessageFormatted = "Thank you for your time. All your responses have been recorded. Goodbye."

    const [showQuestionnaireCompleteModal, setShowQuestionnaireCompleteModal] = useState(false)

    const { questionnaireId, fetchQuestionnaireHistory, questionnaires, isLoading, getPreviousConversationsList } =
        useQuestionnaireHistoryStore()

    const { auth, setAuth } = useAuthStore()

    const [loadingStream, setLoadingStream] = useState(false)

    const router = useRouter()

    const [isAudioPlaying, setIsAudioPlaying] = useState(false)

    // Importing voice note state from zustand store
    const { audioBlob, audioUrl, resetVoiceNote } = useVoiceNoteStore()
    const audioRef = useRef<HTMLAudioElement>(null)

    const previewWaveformRef = useRef<HTMLDivElement>(null)
    const previewWaveSurfer = useRef<WaveSurfer | null>(null)

    // Function to play the audio preview
    const handlePlayAudio = () => {
        if (audioRef.current) {
            audioRef.current.play()
        }
    }

    // Function to cancel the audio preview and reset the store
    const handleCancelAudio = () => {
        resetVoiceNote()
    }

    // Function to toggle play/pause for the audio preview
    const handlePlayPause = () => {
        if (previewWaveSurfer.current) {
            previewWaveSurfer.current.playPause()
        }
    }

    // Create and load WaveSurfer when audioUrl is available
    useEffect(() => {
        if (audioUrl && previewWaveformRef.current) {
            previewWaveSurfer.current = WaveSurfer.create({
                container: previewWaveformRef.current,
                waveColor: "#1b74c3",
                progressColor: "#0014ff",
                cursorColor: "transparent",
                barWidth: 2,
                barGap: 3,
                barRadius: 3,
                height: 32,
                normalize: true
                // responsive: true,
            })
            previewWaveSurfer.current.load(audioUrl)

            // Set up event listeners to update play state
            previewWaveSurfer.current.on("play", () => {
                setIsAudioPlaying(true)
            })
            previewWaveSurfer.current.on("pause", () => {
                setIsAudioPlaying(false)
            })
            previewWaveSurfer.current.on("finish", () => {
                setIsAudioPlaying(false)
            })
        }

        // Cleanup: destroy the WaveSurfer instance if audioUrl changes or component unmounts
        return () => {
            if (previewWaveSurfer.current) {
                previewWaveSurfer.current.destroy()
                previewWaveSurfer.current = null
            }
        }
    }, [audioUrl])

    //update conversations when the questionnaires change in the store
    useEffect(() => {
        if (questionnaires) {
            setConversations(questionnaires)
        }
    }, [questionnaires])

    //generate a new session or load the previous conversation
    useEffect(() => {
        if (!questionnaireId || questionnaireId === "0") {
            const newId = uuidv4()
            setSessionId(newId)

            setConversations([
                {
                    question: staticQuestion,
                    answer: ""
                }
            ])
        } else {
            setSessionId(questionnaireId)
            fetchQuestionnaireHistory(questionnaireId)
        }
    }, [questionnaireId])

    //revalidate questionaires when a new conversation is created
    useEffect(() => {
        if (conversations !== null) {
            // console.log(conversations.length)
            if (conversations.length == 2 && conversations[1].question) {
                getPreviousConversationsList()
            }
        }

        if (
            (conversations && conversations[conversations.length - 1].question === endChatMessageFormatted) ||
            (conversations && conversations[conversations.length - 1].question === endChatMessageNonFormatted)
        ) {
            setShowQuestionnaireCompleteModal(true)
        }
    }, [conversations])

    //getting patient personal info
    useEffect(() => {
        const getUserInfo = async () => {
            const user = await getUserData()
            setPatient(user)
            return user
        }
        getUserInfo()
    }, [])

    useEffect(() => {
        if (patient.name && conversations == null) {
            setConversations([{ question: staticQuestion, answer: "" }])
        }
    }, [patient])

    useEffect(() => {
        if (conversations?.length == 2) getPreviousConversationsList()
    }, [conversations])

    const formatResponse = (rawData: string) => {
        const cleanedData = rawData
            .split("\r\n")
            .filter(line => line.startsWith("data: ") && !line.includes("token_stats"))
            .map(line => line.replace("data: ", ""))
            .join("")
        return cleanedData
    }

    const handleKeyPress = (e: any) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
        }
        if (e.key === "Enter") {
            answerQuestion()
        }
    }

    const handleSendMessage = async () => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/patient/chat/${sessionId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${await getBearerToken()}`
                },
                body: JSON.stringify({
                    content: input
                })
            })

            if (res.status === 403) {
                setError(`Please purchase additional credits to continue. Thank you.`)
                // updateUserPaymentInfo().then(data => {
                //     if (data && data.doctor && data.doctor.id && data.doctor.id.length > 0) {
                //         setAuth(data.doctor)
                //     }
                // })
            }

            if (!res.body) {
                setError(
                    `Looks like there was an issue processing your request. Please try again. If this error persists, contact our help center on`
                )
                return
            }

            //create a text decoder to handle chunked messages
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let reading = false
            let result = ""

            //conversation entry
            let current = conversations
            if (current != null) {
                current[current.length - 1] = {
                    ...current[current.length - 1],
                    answer: input
                }
                current = [...current, { question: "", answer: "" }]
            }
            setConversations(current)

            //read chunk
            while (!reading) {
                const { value, done } = await reader.read()
                result += decoder.decode(value, { stream: !done })

                setLoadingStream(true)

                if (done) {
                    reading = true
                    setLoadingStream(false)
                }

                //update answer as chunks arrive
                setConversations(prevConvo => {
                    if (prevConvo !== null) {
                        const updatedConvo = [...prevConvo]
                        updatedConvo[updatedConvo.length - 1] = {
                            question: formatResponse(result),
                            answer: ""
                        }
                        return updatedConvo
                    }
                    return prevConvo
                })
            }
        } catch (error) {
            console.log("Error sending message: ", error)
            setError(
                `Looks like there was an issue processing your request. Please try again. If this error persists, contact our help center on`
            )
        }
    }

    useEffect(() => {
        const current = containerRef?.current
        if (!current) return
        current.scrollTop = current?.scrollHeight

        scrollRef.current.scrollIntoView(true)
    }, [conversations])

    const resizeTextArea = (e: any) => {
        if (containerRef.current) {
            const maxHeightPx = 128
            // Reset the height so shrinkage works on text removal
            containerRef.current.style.height = "auto"
            const newHeight = containerRef.current.scrollHeight

            // If the content's height exceeds the max height, cap it and allow scrolling
            if (newHeight > maxHeightPx) {
                containerRef.current.style.height = `${maxHeightPx}px`
                containerRef.current.style.overflowY = "auto"
            } else {
                containerRef.current.style.height = `${newHeight}px`
                containerRef.current.style.overflowY = "hidden"
            }
        }
    }

    const answerQuestion = async () => {
        function getCleanMessage(streamText: string): string {
            const marker = "{"
            const markerIndex = streamText.indexOf(marker)

            // If the marker isn't found, or hasn't arrived completely, return the entire text.
            if (markerIndex === -1) {
                return streamText
            }

            // Otherwise, return only the part before the marker.
            return streamText.substring(0, markerIndex)
        }

        if (input.trim() !== "") {
            handleSendMessage()
            setInput("")
            setTextareaHeight("48px")
        } else if (audioBlob) {
            // Create local audio ID
            const localAudioId = useAudioMessagesStore.getState().createLocalAudioId()

            // Store the audio blob in AudioMessagesStore
            await useAudioMessagesStore.getState().addAudioMessage(localAudioId, audioBlob)

            // Update the last conversation's answer to show local audio message
            setConversations(prevConvo => {
                if (prevConvo && prevConvo.length > 0) {
                    const updatedConvo = [...prevConvo]
                    updatedConvo[updatedConvo.length - 1] = {
                        ...updatedConvo[updatedConvo.length - 1],
                        answer: `#!AUDIO_MSG_LOCAL:${localAudioId}`
                    }
                    return [...updatedConvo, { question: "", answer: "" }]
                }
                return prevConvo
            })

            let result = ""
            setLoadingStream(true)

            await uploadVoiceNote(
                sessionId,
                audioBlob,
                (message: string) => {
                    result = getCleanMessage(message)
                    // console.log(result)
                    // Update the new conversation's question with the streamed result.
                    // setConversations(prevConvo => {
                    //     if (prevConvo && prevConvo.length > 0) {
                    //         const updatedConvo = [...prevConvo]
                    //         updatedConvo[updatedConvo.length - 1] = {
                    //             ...updatedConvo[updatedConvo.length - 1],
                    //             question: formatResponse(result)
                    //         }
                    //         return updatedConvo
                    //     }
                    //     return prevConvo
                    // })

                    setConversations(prevConvo => {
                        if (prevConvo) {
                            const updatedConvo = [...prevConvo]
                            updatedConvo[updatedConvo.length - 1] = {
                                question: result,
                                answer: ""
                            }
                            return updatedConvo
                        }
                        return prevConvo
                    })
                },
                () => {
                    // Optional: handle errors if needed.
                },
                () => {
                    setLoadingStream(false)
                    resetVoiceNote()
                },
                () => {}
            )
        }
    }

    const handleVoiceNote = async (audioBlob: Blob) => {
        // Here you would typically send the voice note to your backend
        // For now, let's just convert it to text as a placeholder
        // setInput("Voice note recorded and ready to send")
    }

    if (error) {
        return (
            <ErrorOnRequest
                error={error}
                tryAgain={() => {
                    //clear error,
                    setError(null)
                    handleSendMessage()
                }}
            />
        )
    }

    if (isLoading) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <div className="text-blue-500 font-bold ">Loading Chats...</div>
            </div>
        )
    }

    return showHome ? (
        <ConditionHome auth={auth} setShowHome={setShowHome} />
    ) : (
        <main className="w-full h-full">
            {showQuestionnaireCompleteModal && (
                <QuestionnaireCompleteModal onClose={() => setShowQuestionnaireCompleteModal(false)} />
            )}

            <section className="mx-auto h-full flex flex-col items-start justify-between">
                <div className="w-full flex-1 overflow-y-auto">
                    <div
                        className="w-full h-full overflow-x-hidden scroll-smooth"
                        // ref={containerRef}
                    >
                        {conversations?.map((conversation, index) => (
                            <ConversationPair
                                key={index}
                                {...conversation}
                                userName={patient.name || "U"}
                                loadingStream={index === conversations.length - 1 ? loadingStream : false}
                            />
                        ))}

                        <div ref={scrollRef} />
                    </div>
                </div>

                <div className="w-full h-16 flex items-center justify-center ">
                    <div className="w-full flex gap-2 items-end justify-between">
                        {!isRecording ? (
                            audioUrl ? (
                                // Audio preview with WaveSurfer replaces the textarea
                                <div className="border bg-white shadow rounded-lg flex-1 h-11 w-full">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex gap-4 items-center justify-start w-full">
                                            <button
                                                onClick={handlePlayPause}
                                                className="p-2 rounded-lg text-blue-600"
                                                aria-label={isAudioPlaying ? "Pause recording" : "Play recording"}>
                                                {isAudioPlaying ? (
                                                    <BiPause className="" size={25} />
                                                ) : (
                                                    <BiPlay className="" size={25} />
                                                )}
                                            </button>
                                            <div ref={previewWaveformRef} className="w-full h-8"></div>
                                        </div>
                                        <div className=" flex justify-center items-center">
                                            <button
                                                onClick={handleCancelAudio}
                                                className="p-2 text-red-500 rounded-lg"
                                                aria-label="Delete recording">
                                                <BiTrash className="" size={25} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Normal textarea when no audio preview exists
                                <textarea
                                    ref={containerRef}
                                    value={input}
                                    rows={1}
                                    onChange={e => {
                                        setInput(e.target.value)
                                        resizeTextArea(e)
                                    }}
                                    onKeyPress={handleKeyPress}
                                    className="border h-full shadow rounded-lg flex-1 text-sm focus:outline-none py-3 px-2 resize-none"
                                    placeholder="Talk to me"
                                    style={{
                                        maxHeight: "8rem"
                                    }}></textarea>
                            )
                        ) : (
                            <div className="border shadow rounded-lg flex-1 h-11 flex justify-center items-center bg-gray-100">
                                <div id="waveform-container" className="h-8 px-2 w-full"></div>
                            </div>
                        )}
                        {/* ChatMessageSend is always rendered */}
                        <ChatMessageSend
                            input={input}
                            answerQuestion={answerQuestion}
                            isRecording={isRecording}
                            setIsRecording={setIsRecording}
                            onVoiceNoteRecorded={handleVoiceNote}
                        />
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Condition

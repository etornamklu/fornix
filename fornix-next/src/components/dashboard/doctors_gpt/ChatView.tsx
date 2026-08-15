"use client"
import { useEffect, useState, useCallback } from "react"
import { DoctorsGptRequestProps, MedFindMessage, MedFindMessageType } from "@/utils/types"
import { VscSend } from "react-icons/vsc"
import { AiOutlineEdit } from "react-icons/ai"
import { FaCheck } from "react-icons/fa6"
import { CgClose } from "react-icons/cg"

import ConversationView from "@/components/dashboard/doctors_gpt/ConversationView"
import { getMedFindThreadData, renameDoctorChatSession } from "@/services/dashboard/threads.service"
import { ReceiveMessage } from "@/components/dashboard/doctors_gpt/ReceiveMessage"
import { SendMessage } from "@/components/dashboard/doctors_gpt/SendMessage"
import useMedFindHistoryStore from "../../../../store/MedFindHistoryStore"
import { VoiceRecorder } from "@/components/dashboard/patient_diagnosis/VoiceRecorder"
import { StreamPatientGPTFromVoice } from "@/services/dashboard/patientgpt.service"

const InputController = ({
    handleAddRequest,
    handleVoiceRequest
}: {
    handleAddRequest: (s: string) => void
    handleVoiceRequest: (audioBlob: Blob) => void
}) => {
    const [inputText, setInputText] = useState("")
    const [isVoiceMode, setIsVoiceMode] = useState(false)

    const handleVoiceRecorded = useCallback(
        (audioBlob: Blob) => {
            console.log("🎵 MedFind voice recorded with blob:", audioBlob)
            handleVoiceRequest(audioBlob)
            setIsVoiceMode(false)
        },
        [handleVoiceRequest]
    )

    const handleRecordingStart = useCallback(() => {
        console.log("🎬 MedFind recording started")
        setIsVoiceMode(true)
    }, [])

    const handleRecordingStop = useCallback(() => {
        console.log("⏹️ MedFind recording stopped")
        setIsVoiceMode(false)
    }, [])

    return (
        <div className="flex w-full bg-white border items-center justify-between shadow rounded-xl">
            <div className="flex-1 relative">
                {!isVoiceMode ? (
                    <input
                        type="text"
                        placeholder="Type here..."
                        className="h-16 w-full rounded-xl px-4 outline-none"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                    />
                ) : (
                    <div className="h-16 w-full rounded-xl px-4 flex items-center">
                        <div id="voice-waveform-container" className="w-full h-8"></div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mr-3">
                {isVoiceMode || inputText.length === 0 ? (
                    <VoiceRecorder
                        onVoiceRecorded={handleVoiceRecorded}
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                    />
                ) : (
                    <div
                        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 border select-none
                            ${inputText ? "text-white bg-blue-500 hover:shadow cursor-pointer" : "text-gray-400 bg-gray-50"}`}
                        onClick={() => {
                            if (inputText) {
                                handleAddRequest(inputText)
                                setInputText("")
                            }
                        }}>
                        <span className="text-lg">Send</span>
                        <VscSend size={20} />
                    </div>
                )}
            </div>
        </div>
    )
}

export const ChatView = ({
    requests,
    handleAddRequest,
    handleVoiceRequest
}: {
    requests: DoctorsGptRequestProps[]
    handleAddRequest: (request: string) => void
    handleVoiceRequest: (audioBlob: Blob) => void
}) => {
    const [chatHistory, setChatHistory] = useState<MedFindMessage[]>([])
    const [isEditing, setIsEditing] = useState(false)
    const [tempChatName, setTempChatName] = useState("")

    const { medFindHistoryList, updateMedFindHistoryList } = useMedFindHistoryStore()
    const sessionId = typeof window !== "undefined" ? localStorage.getItem("mfi") : null
    const currentChatName = medFindHistoryList.find(item => item.session_id === sessionId)?.name || "New Chat"

    useEffect(() => {
        const handleMfiChange = () => {
            const sessionId = localStorage.getItem("mfi")
            if (sessionId) {
                getMedFindThreadData(sessionId).then(data => {
                    setChatHistory(data.reverse() as MedFindMessage[])
                })
            }
        }

        handleMfiChange()
        window.addEventListener("storage", handleMfiChange)
        return () => {
            window.removeEventListener("storage", handleMfiChange)
        }
    }, [])

    const handleRenameChat = async () => {
        if (sessionId && tempChatName.trim()) {
            try {
                await renameDoctorChatSession(sessionId, tempChatName.trim())
                updateMedFindHistoryList()
            } catch (error) {
                console.error("Error renaming chat", error)
            }
            setIsEditing(false)
        }
    }

    const handleCancelRename = () => {
        setTempChatName(currentChatName)
        setIsEditing(false)
    }

    return (
        <div className="flex flex-col justify-between w-full h-full p-3 lg:p-6 bg-[#f1f5f9] rounded-xl">
            {/* Header with renaming functionality */}
            <div className="flex pb-2 justify-between items-center border-b">
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            type="text"
                            value={tempChatName}
                            onChange={e => setTempChatName(e.target.value)}
                            className="w-full py-1.5 text-base sm:text-lg outline-none rounded px-2 sm:px-3 italic bg-white font-light"
                        />
                        <button onClick={handleCancelRename} className="p-1">
                            <CgClose size={20} />
                        </button>
                        <button onClick={handleRenameChat} className="p-1">
                            <FaCheck size={20} />
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-lg sm:text-xl font-semibold truncate">{currentChatName}</h2>
                        <button
                            onClick={() => {
                                setTempChatName(currentChatName)
                                setIsEditing(true)
                            }}
                            className="p-2 sm:p-3">
                            <AiOutlineEdit size={20} />
                        </button>
                    </>
                )}
            </div>

            {/* Chat Messages */}
            <div className="pt-2 pb-5 lg:pt-8 flex flex-1 flex-col gap-6 overflow-y-scroll chat-view-scrollbar">
                {chatHistory.length > 0 &&
                    chatHistory.map((mfItem, index) => (
                        <div key={index}>
                            {mfItem.type === MedFindMessageType.AI ? (
                                <ReceiveMessage chatMessage={mfItem} />
                            ) : (
                                <SendMessage chatMessage={mfItem} />
                            )}
                        </div>
                    ))}

                {requests.map((req, index) => (
                    <div key={index}>
                        <ConversationView request={req} handleAddRequest={handleAddRequest} />
                    </div>
                ))}
            </div>

            {/* Input Controller */}
            <InputController handleAddRequest={handleAddRequest} handleVoiceRequest={handleVoiceRequest} />
        </div>
    )
}

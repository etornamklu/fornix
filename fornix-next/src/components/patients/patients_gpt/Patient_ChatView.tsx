"use client"
import { useEffect, useState } from "react"
import { MedFindPatientType, PatientMedFindMessage, PatientsGptRequestProps } from "@/utils/types"
import { VscSend } from "react-icons/vsc"
import Patient_ConversationView from "@/components/patients/patients_gpt/Patient_ConversationView"
import { PatientSendChat } from "@/components/patients/patients_gpt/SendChat"
import { PatientReceiveChat } from "@/components/patients/patients_gpt/ReceiveChat"
import { getPatientMedFindData, renameChatSession } from "@/services/dashboard/threads.service"
import usePatientMedFindHistoryStore from "../../../../store/PatientMedFindHistoryStore"
import { AiOutlineEdit } from "react-icons/ai"
import { FaCheck } from "react-icons/fa6"
import { CgClose } from "react-icons/cg"

const LoaderSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <span className="text-xl font-bold">Loading Chat History...</span>
    </div>
)

const InputController = ({ handleAddRequest }: { handleAddRequest: (s: string) => void }) => {
    const [inputText, setInputText] = useState("")
    return (
        <div className="flex w-full bg-white border items-center justify-between shadow rounded-xl">
            <input
                type="text"
                placeholder="Message Fornix AI..."
                className="h-16 w-full rounded-xl px-4 outline-none"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
            />
            <div
                className={`flex items-center justify-center gap-2 rounded-lg mr-3 px-4 py-2 border select-none ${
                    inputText ? "text-white bg-blue-500 hover:shadow cursor-pointer" : "text-gray-400 bg-gray-50"
                }`}
                onClick={() => {
                    if (inputText) {
                        handleAddRequest(inputText)
                        setInputText("")
                    }
                }}>
                <span className="text-lg">Send</span>
                <VscSend size={20} />
            </div>
        </div>
    )
}

export const PatientChatView = ({
    requests,
    handleAddRequest
}: {
    requests: PatientsGptRequestProps[]
    handleAddRequest: (request: string) => void
}) => {
    const [chatHistory, setChatHistory] = useState<PatientMedFindMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [conversationId, setConversationId] = useState(
        () => localStorage.getItem("pmfi") || new Date().getTime().toString()
    )

    const [isEditing, setIsEditing] = useState(false)
    const [tempChatName, setTempChatName] = useState("New Chat")

    const { patientmedFindHistoryList, updatepatientMedFindHistoryList } = usePatientMedFindHistoryStore()

    useEffect(() => {
        const handleMfiChange = () => {
            const sessionId = localStorage.getItem("pmfi")
            if (sessionId) {
                setConversationId(sessionId)
                setIsLoading(true)
                getPatientMedFindData(sessionId)
                    .then(data => {
                        setChatHistory(data as PatientMedFindMessage[])
                        setIsLoading(false)
                    })
                    .catch(error => {
                        console.error("Error fetching chat history:", error)
                        setIsLoading(false)
                    })
            }
        }

        handleMfiChange()
        window.addEventListener("storage", handleMfiChange)
        return () => {
            window.removeEventListener("storage", handleMfiChange)
        }
    }, [])

    useEffect(() => {
        const currentChat = patientmedFindHistoryList.find(item => item.session_id === conversationId)
        setTempChatName(currentChat?.name || "New Chat")
    }, [conversationId, patientmedFindHistoryList])

    const handleRenameChat = async () => {
        if (!tempChatName.trim()) {
            alert("Chat name cannot be empty")
            return
        }
        try {
            await renameChatSession(conversationId, tempChatName)
            updatepatientMedFindHistoryList()
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to rename chat session:", error)
            alert("Failed to rename chat session")
        }
    }

    const handleCancelRename = () => {
        const currentChat = patientmedFindHistoryList.find(item => item.session_id === conversationId)
        setTempChatName(currentChat?.name || "New Chat")
        setIsEditing(false)
    }

    return (
        <div className="flex flex-col justify-between w-full h-full p-3 bg-[#f1f5f9] rounded-xl">
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
                            <CgClose size={22} />
                        </button>
                        <button onClick={handleRenameChat} className="p-1">
                            <FaCheck size={20} />
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-semibold">
                            {patientmedFindHistoryList.find(item => item.session_id === conversationId)?.name ||
                                "New Chat"}
                        </h2>
                        <button
                            onClick={() => {
                                setTempChatName(
                                    patientmedFindHistoryList.find(item => item.session_id === conversationId)?.name ||
                                        ""
                                )
                                setIsEditing(true)
                            }}
                            className="p-3">
                            <AiOutlineEdit size={22} />
                        </button>
                    </>
                )}
            </div>

            {isLoading ? (
                <LoaderSpinner />
            ) : (
                <div className="pt-2 pb-5 lg:pt-8 flex flex-1 flex-col gap-6 overflow-y-scroll chat-view-scrollbar">
                    {chatHistory.length > 0 &&
                        chatHistory.map((pmfItem, index) => (
                            <div key={index}>
                                {pmfItem.role === MedFindPatientType.AI ? (
                                    <PatientSendChat chatMessage={pmfItem} />
                                ) : (
                                    <PatientReceiveChat chatMessage={pmfItem} />
                                )}
                            </div>
                        ))}
                    {requests.map((req, index) => (
                        <div key={index}>
                            <Patient_ConversationView request={req} />
                        </div>
                    ))}
                </div>
            )}

            <InputController handleAddRequest={handleAddRequest} />
        </div>
    )
}

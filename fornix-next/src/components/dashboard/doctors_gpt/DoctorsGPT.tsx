"use client"
import { useEffect, useState } from "react"
import EmptyMessagesInputField from "@/components/dashboard/doctors_gpt/gpt_input_field"
import MessagesField from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import { DoctorsGptRequestProps } from "@/utils/types"
import { ChatView } from "@/components/dashboard/doctors_gpt/ChatView"
import { motion } from "framer-motion"
import useMedFindHistoryStore from "../../../../store/MedFindHistoryStore"

export const DoctorsGPT = () => {
    const [requests, setRequests] = useState<DoctorsGptRequestProps[]>([])
    const [textAreaValue, setTextAreaValue] = useState("")
    const [showChatView, setShowChatView] = useState(false)
    const [conversationId, setConversationId] = useState("BLANK")

    // Function to handle adding a new request
    const handleAddRequest = (message: string) => {
        console.log("Adding request:", message)
        setRequests(requests => [
            ...requests,
            {
                conversation_id: conversationId,
                content: message
            }
        ])
    }

    // Function to handle voice requests
    const handleVoiceRequest = (audioBlob: Blob) => {
        console.log("Adding voice request:", audioBlob)
        setRequests(requests => [
            ...requests,
            {
                conversation_id: conversationId,
                content: "[Voice Message]",
                audioBlob: audioBlob
            }
        ])
    }

    // Function to handle submitting the GPT request
    const handleGptSubmit = () => {
        if (!textAreaValue) {
            console.log("Text area is empty")
            return
        }
        console.log("Submitting GPT request:", textAreaValue)
        handleAddRequest(textAreaValue)
    }

    useEffect(() => {
        const sessionId = new Date().getTime().toString()
        console.log("Initializing conversationId:", sessionId)

        const sessionIdFromStorage = localStorage.getItem("mfi")
        if (sessionIdFromStorage) {
            console.log("Session ID found in localStorage:", sessionIdFromStorage)
            setConversationId(sessionIdFromStorage)
            setShowChatView(true)
        } else setConversationId(sessionId)

        const handleMfiChange = (event: StorageEvent) => {
            const mfiValue = localStorage.getItem("mfi")
            console.log("Storage event triggered, mfiValue:", mfiValue)
            setRequests([])
            const newConversationId = mfiValue || new Date().getTime().toString()
            console.log("Updated conversationId:", newConversationId)
            setConversationId(newConversationId)
            setShowChatView(!!mfiValue)
            setTextAreaValue("")
        }

        window.addEventListener("storage", handleMfiChange)

        return () => {
            window.removeEventListener("storage", handleMfiChange)
        }
    }, [])

    useEffect(() => {
        console.log("Requests updated:", requests)
        if (requests.length) setShowChatView(true)
    }, [requests])

    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    return (
        <motion.div
            className="w-full h-full flex justify-center"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeAnimation}
            transition={{ duration: 0.1, ease: "easeIn" }}>
            {!showChatView ? (
                <MessagesField>
                    <EmptyMessagesInputField
                        onExampleClick={() => {}}
                        onGenerateClick={handleGptSubmit}
                        textAreaValue={textAreaValue}
                        setTextAreaValue={setTextAreaValue}
                        onVoiceRecorded={handleVoiceRequest}
                    />
                </MessagesField>
            ) : (
                <div className="w-full">
                    <ChatView
                        requests={requests}
                        handleAddRequest={handleAddRequest}
                        handleVoiceRequest={handleVoiceRequest}
                    />
                </div>
            )}
        </motion.div>
    )
}

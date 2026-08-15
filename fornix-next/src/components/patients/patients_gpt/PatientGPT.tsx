"use client"
import { useEffect, useState } from "react"
import PatientEmptyMessagesInputField from "@/components/patients/patients_gpt/Patientgpt_input_field"
import MessagesField from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import { PatientsGptRequestProps } from "@/utils/types"
import { PatientChatView } from "@/components/patients/patients_gpt/Patient_ChatView"

import { motion } from "framer-motion"

export const PatientsGPT = () => {
    // const [isProcessing, setIsProcessing] = useState(false)
    const [requests, setRequests] = useState<PatientsGptRequestProps[]>([])
    const [textAreaValue, setTextAreaValue] = useState("")
    // const isMounted = useRef(false)
    const [showChatView, setShowChatView] = useState(false)
    const [conversationId, setConversationId] = useState("BLANK")

    const handleAddRequest = (message: string) => {
        setRequests(requests => [
            ...requests,
            {
                conversation_id: conversationId,
                content: message
            }
        ])
    }

    const handleGptSubmit = () => {
        if (!textAreaValue) return
        // add to requests which will begin gen
        handleAddRequest(textAreaValue)
    }

    useEffect(() => {
        console.log(conversationId)
    }, [conversationId])

    useEffect(() => {
        // make conversationId
        setConversationId(new Date().getTime().toString())

        const sessionId = localStorage.getItem("pmfi")
        if (sessionId) {
            setShowChatView(true)
        }

        const handleMfiChange = (event: StorageEvent) => {
            const mfiValue = localStorage.getItem("pmfi")
            setRequests([])
            setConversationId(mfiValue ? mfiValue.split("-")[0] : new Date().getTime().toString())
            setShowChatView(!!mfiValue)
            setTextAreaValue("")
        }

        window.addEventListener("storage", handleMfiChange)

        return () => {
            window.removeEventListener("storage", handleMfiChange)
        }
    }, [])

    useEffect(() => {
        console.log(requests.length)
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
                    <PatientEmptyMessagesInputField
                        onExampleClick={() => {
                            // setIsProcessing(true)
                        }}
                        onGenerateClick={handleGptSubmit}
                        textAreaValue={textAreaValue}
                        setTextAreaValue={setTextAreaValue}
                    />
                    {/*  <StopProcessingButton
                        isOpen={isProcessing}
                        onClick={() => {
                            setIsProcessing(false)
                        }}
                    />*/}
                </MessagesField>
            ) : (
                <PatientChatView requests={requests} handleAddRequest={handleAddRequest} />
            )}
        </motion.div>
    )
}

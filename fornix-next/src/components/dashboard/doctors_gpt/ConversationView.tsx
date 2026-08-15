import { DoctorsGptRequestProps } from "@/utils/types"
import { useEffect, useRef, useState } from "react"
import { useResponseAuth } from "@/utils/auth.client"
import { StreamDoctorGPT } from "@/services/dashboard/gpt.service"
import { StreamPatientGPTFromVoice } from "@/services/dashboard/patientgpt.service"
import MessagesField from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import { SendMessage } from "@/components/dashboard/doctors_gpt/SendMessage"
import { ReceiveMessage } from "@/components/dashboard/doctors_gpt/ReceiveMessage"
import useMedFindHistoryStore from "../../../../store/MedFindHistoryStore"

const ConversationView = ({
    request,
    handleAddRequest
}: {
    request: DoctorsGptRequestProps
    handleAddRequest: (request: string) => void
}) => {
    const isMounted = useRef(false)
    const [response, setResponse] = useState("")
    const messagesEndRef = useRef<null | HTMLDivElement>(null)
    const { updateMedFindHistoryList } = useMedFindHistoryStore()

    const onStreamAuthError = useResponseAuth()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [response])

    useEffect(() => {
        async function asyncRunnerDoctorsGpt() {
            if (request.audioBlob) {
                // Handle voice request
                console.log("Processing voice request")
                await StreamPatientGPTFromVoice(
                    request.audioBlob,
                    request.conversation_id,
                    async (message: string) => {
                        setResponse(message)
                        console.log("Voice response:", message)
                    },
                    () => {
                        onStreamAuthError()
                    },
                    () => {
                        updateMedFindHistoryList()
                    },
                    () => {
                        setResponse("You have run out of credits, please purchase more to continue.")
                    }
                )
            } else {
                // Handle text request
                console.log("Processing text request")
                await StreamDoctorGPT(
                    request,
                    async (message: string) => {
                        setResponse(message)
                        console.log("Text response:", message)
                    },
                    () => {
                        onStreamAuthError()
                    },
                    () => {
                        updateMedFindHistoryList()
                    },
                    () => {
                        setResponse("You have run out of credits, please purchase more to continue.")
                    }
                )
            }
        }

        if (!isMounted.current) {
            asyncRunnerDoctorsGpt().then()
        }

        isMounted.current = true
    }, [])

    return (
        <>
            <MessagesField key={7}>
                <SendMessage request={request} />
                <ReceiveMessage response={response} handleAddRequest={handleAddRequest} />
            </MessagesField>
            <div ref={messagesEndRef} />
        </>
    )
}

export default ConversationView

import { PatientsGptRequestProps } from "@/utils/types"
import { useEffect, useRef, useState, useCallback } from "react"
import { useResponseAuth } from "@/utils/auth.client"
import { StreamPatientGPT } from "@/services/dashboard/patientgpt.service"
import MessagesField from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import { PatientSendChat } from "@/components/patients/patients_gpt/SendChat"
import { PatientReceiveChat } from "@/components/patients/patients_gpt/ReceiveChat"
import usePatientMedFindHistoryStore from "../../../../store/PatientMedFindHistoryStore"

const Patient_ConversationView = ({ request }: { request: PatientsGptRequestProps }) => {
    const isMounted = useRef(false)
    const [response, setResponse] = useState("")
    const messagesEndRef = useRef<null | HTMLDivElement>(null)
    const { updatepatientMedFindHistoryList } = usePatientMedFindHistoryStore()

    const onStreamAuthError = useResponseAuth()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [response])

    useEffect(() => {
        async function asyncRunnerPatientsGpt() {
            await StreamPatientGPT(
                request,
                async (message: string) => {
                    setResponse(message)
                },
                () => {
                    onStreamAuthError()
                },
                () => {
                    updatepatientMedFindHistoryList()
                },
                () => {
                    setResponse("You have run out of credits, please purchase more to continue.")
                }
            )
        }

        if (!isMounted.current) {
            asyncRunnerPatientsGpt().then()
        }

        isMounted.current = true
    }, [])

    return (
        <>
            <MessagesField key={7}>
                <PatientSendChat request={request} />
                <PatientReceiveChat response={response} />
            </MessagesField>
            <div ref={messagesEndRef} />
        </>
    )
}

export default Patient_ConversationView

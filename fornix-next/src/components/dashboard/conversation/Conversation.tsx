import { useEffect } from "react"
import RecordConversation from "./RecordConversation"
import PatientDetails from "./PatientDetails"
// import ConversationResult from "./ConversationResult";
import dynamic from "next/dynamic"
import { authDefault } from "@/utils/types"

import { useSelectedPatientStore } from "../../../../store/SelectedPatientStore"
import { usePatientFormStore } from "../../../../store/patientFormStore"
import useConversationPageRouteStore from "../../../../store/ConversationPageRouteStore"

const ConversationResult = dynamic(() => import("./ConversationResult"), {
    ssr: false
})

export const Conversation = () => {
    const patientNameFromForm = usePatientFormStore(state => state.name)
    const patientNameFromConnections = useSelectedPatientStore(state => state.selectedPatient?.name)
    const clearSelectedPatient = useSelectedPatientStore(state => state.clearSelectedPatient)

    const { step, setStep } = useConversationPageRouteStore()
    //setting the initial step to 0 when component mounts
    useEffect(() => {
        setStep(0)
        if (patientNameFromConnections) {
            clearSelectedPatient()
        }
    }, [clearSelectedPatient])

    const pages = [
        <PatientDetails key={0} stepToNextPage={setStep} />,
        <RecordConversation
            key={1}
            {...{ patientName: (patientNameFromForm || patientNameFromConnections)!, setStep }}
        />,
        <ConversationResult key={2} />
    ]
    return <div className="w-full h-full flex flex-col justify-center items-center px-1 lg:px-0">{pages[step]}</div>
}

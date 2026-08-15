import { PatientsGptRequestProps, PatientMedFindMessage } from "@/utils/types"
import { useState, useEffect } from "react"
import { MessageAvatar } from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import styles from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import { IoTimeOutline } from "react-icons/io5"

export const PatientSendChat = ({
    request,
    chatMessage
}: {
    request?: PatientsGptRequestProps
    chatMessage?: PatientMedFindMessage
}) => {
    const [fullHeight, setFullHeight] = useState(false)

    useEffect(() => {
        console.log("Chat Message:", chatMessage)
    }, [chatMessage])

    return (
        <div className="flex flex-col gap-2">
            <MessageAvatar user={"patient"} />
            <div className={`pl-16 flex justify-end`}>
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
                                chatMessage.content
                            ) : (
                                <IoTimeOutline size={20} />
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { PatientsGptResponse, PatientMedFindMessage } from "@/utils/types"
import { useEffect, useState } from "react"
import { patientgptResponseToJson, patienttempConvertChatMessageToStd } from "@/utils/dashboard/patientgpt"
import { MessageAvatar } from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import styles from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import { AddLineBreak } from "@/components/dashboard/AddLineBreak"
import { PatientLinkPreview } from "@/components/patients/patients_gpt/Patient_LinkPreview"
import LoadingDiagnosis from "@/components/dashboard/patient_diagnosis/generate_diagnosis/LoadingDiagnosis"

export const PatientReceiveChat = ({
    response = "",
    chatMessage
}: {
    response?: string
    chatMessage?: PatientMedFindMessage
}) => {
    const [fullHeight, setFullHeight] = useState(true)

    // let jsonResponse: PatientsGptResponse | string
    const [jsonResponse, setJsonResponse] = useState<PatientsGptResponse | string>(response)

    useEffect(() => {
        if (chatMessage) setJsonResponse(patienttempConvertChatMessageToStd(chatMessage))
        else setJsonResponse(response ? patientgptResponseToJson(response) : "")
    }, [chatMessage, response])

    useEffect(() => {
        console.log("Chat Message:", chatMessage)
    }, [chatMessage])

    return (
        <div className="flex flex-col gap-2 w-full h-full">
            <MessageAvatar user={"fornix"} />
            <div className={`pr-3 sm:pr-8 lg:min-w-full xl:min-w-[42rem]`}>
                <div
                    className={`flex h-full w-full px-4 py-4 text-black rounded-xl ${
                        !fullHeight && "max-h-28"
                    } bg-white ${styles.receiveMessage}`}
                    // onClick={() => setFullHeight(!fullHeight)}
                >
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
                                            {/*<Markdown>*/}
                                            {/*    {jsonResponse.response}*/}
                                            {/*</Markdown>*/}
                                        </div>

                                        {jsonResponse.source_links && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                {jsonResponse.source_links.map((link, i) => (
                                                    <div key={i + link.url} className="w-full">
                                                        <PatientLinkPreview sourceLink={link} />
                                                    </div>
                                                ))}
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
            </div>
        </div>
    )
}

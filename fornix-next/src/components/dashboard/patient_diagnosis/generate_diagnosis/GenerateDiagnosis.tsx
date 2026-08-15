import { CiCircleInfo } from "react-icons/ci"
import { IoMdCheckmark } from "react-icons/io"
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import {
    AIPatientThread,
    Diagnosis,
    DiagnosisStreamProps,
    DoctorDashboardDiagnosis,
    SummaryItem,
    UserConnectionsUser
} from "@/utils/types"
import {
    storeDiagnosis,
    storeSummary,
    StreamAIPatientSummary,
    StreamAmbientConversationSummary,
    StreamDiagnosis,
    StreamSummary,
    StreamSummaryFromVoice,
    unlinkPatientFromDiagnosis
} from "@/services/dashboard/diagnosis.service"
import { clinicalKeys, diagnosisCompletionResponseToJson, summaryResponseToJson } from "@/utils/dashboard/diagnosis"
import { ClinicalItem } from "@/components/dashboard/patient_diagnosis/generate_diagnosis/ClinicalItem"
import { FaAngleDown, FaAngleUp, FaCheck } from "react-icons/fa6"
import MessagesField, {
    MessageAvatar,
    ReceiveDiagnosis,
    SendSummary
} from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message"
import styles from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import { HiOutlineSparkles } from "react-icons/hi2"
import { AnimatePresence, motion } from "framer-motion"
import { useResponseAuth } from "@/utils/auth.client"
import { createDiagnosis, updateDiagnosis } from "@/services/dashboard/patient_history.service"
import { CgClose } from "react-icons/cg"
import { AiOutlineEdit } from "react-icons/ai"
import PatientSelector from "@/components/global/PatientSelector"
import { getAllConnections } from "@/services/dashboard/connections.service"
import LoadingDiagnosis from "./LoadingDiagnosis"

export const GenerateDiagnosis = ({
    patientData,
    setShowDiagnosisPage,
    handleInsufficientCredits,
    selectedPatient,
    onPatientUpdate,
    diagnosisId,
    audioBlob,
    clearAudioBlob
}: {
    patientData: DiagnosisStreamProps
    setShowDiagnosisPage: Dispatch<SetStateAction<boolean>>
    handleInsufficientCredits: () => void
    selectedPatient: UserConnectionsUser | null
    onPatientUpdate?: (patient: UserConnectionsUser | null) => void
    diagnosisId?: string
    audioBlob?: Blob
    clearAudioBlob?: () => void
}) => {
    const [generatedKeys, setGeneratedKeys] = useState([false])

    // -1 denotes none, show diagnosis
    const [activeKey, setActiveKey] = useState(-1)

    const [summary, setSummary] = useState<string | null>("")
    const [rawSummary, setRawSummary] = useState("")
    const [diagnosis, setDiagnosis] = useState<Diagnosis>({} as Diagnosis)
    // default primary to the most likely using -1, for values >= 0, select from alternatives
    const [primaryDiagnosisIndex, setPrimaryDiagnosisIndex] = useState(-1)

    const isMounted = useRef(false)
    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const [showMobileClinicalMenu, setShowMobileClinicalMenu] = useState(false)
    const [enableDiagNameEditing, setEnableDiagNameEditing] = useState(false)
    const [genDiag, setGenDiag] = useState({} as DoctorDashboardDiagnosis)
    const [diagName, setDiagName] = useState("Diagnosis")
    const diagNameRef = useRef("")

    const [currentPatient, setCurrentPatient] = useState<UserConnectionsUser | null>(selectedPatient)
    const [isVoiceBased, setIsVoiceBased] = useState(false)

    const onStreamAuthError = useResponseAuth()

    const handlePatientLink = async (patient: UserConnectionsUser | null) => {
        if (genDiag.id) {
            try {
                let updateResp
                if (patient) {
                    // Link patient using existing updateDiagnosis function
                    updateResp = await updateDiagnosis(genDiag.id, { patient_id: patient.id })
                } else {
                    // Unlink patient using the new dedicated endpoint
                    updateResp = await unlinkPatientFromDiagnosis(genDiag.id)
                }

                if (updateResp) {
                    window.localStorage.setItem("diag", JSON.stringify(updateResp))
                    setGenDiag(updateResp)
                    window.dispatchEvent(new Event("storage"))
                    window.dispatchEvent(new Event("diagnosisChanged"))
                }
            } catch (error) {
                console.error("Failed to link/unlink patient:", error)
            }
        }
        setCurrentPatient(patient)
        onPatientUpdate?.(patient)
    }

    const updateDiagName = async () => {
        // update genDiag, localstorage and backend
        const updatedDiag = { ...genDiag, name: diagName }
        setGenDiag(updatedDiag)
        const updateResp = await updateDiagnosis(genDiag.id, { name: updatedDiag.name })
        if (updateResp) window.localStorage.setItem("diag", JSON.stringify(updateResp))
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new Event("diagnosisChanged"))
    }

    useEffect(() => {
        const diag = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
        setGenDiag(diag)
        setDiagName(diag.name)
        diagNameRef.current = diag.name

        // Load linked patient if diagnosis has patient_id
        const loadLinkedPatient = async () => {
            if (diag.patient_id) {
                try {
                    const connections = await getAllConnections()
                    if (connections && Array.isArray(connections)) {
                        // Step 1: Find the connection that has the matching patient ID
                        const matchingConnection = connections.find((connection: any) => {
                            return connection.patient && connection.patient.id === diag.patient_id
                        })

                        // Step 2: Extract the patient from the connection
                        if (matchingConnection && matchingConnection.patient) {
                            const linkedPatient: UserConnectionsUser = matchingConnection.patient
                            setCurrentPatient(linkedPatient)
                            onPatientUpdate?.(linkedPatient)
                        } else {
                            setCurrentPatient(null)
                            onPatientUpdate?.(null)
                        }
                    }
                } catch (error) {
                    // Error loading linked patient - silently handle
                }
            } else {
                setCurrentPatient(null)
                onPatientUpdate?.(null)
            }
        }

        loadLinkedPatient()

        let arr = [false]
        const localClinicalKeys = diag.clinical_items ? diag.clinical_items.map(lci => Object.keys(lci)[0]) : []
        clinicalKeys.forEach((clinicalKey, index) => {
            if (localClinicalKeys.includes(clinicalKey.value)) arr[index] = true
        })
        // console.log(arr)
        setGeneratedKeys(arr)
        setActiveKey(-1)
    }, [])

    // Watch for localStorage changes to reload diagnosis and patient data
    useEffect(() => {
        const diag = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
        if (diag.id) {
            setGenDiag(diag)
            setDiagName(diag.name)
            diagNameRef.current = diag.name

            // Load linked patient if diagnosis has patient_id
            const loadLinkedPatient = async () => {
                if (diag.patient_id) {
                    try {
                        const connections = await getAllConnections()
                        if (connections && Array.isArray(connections)) {
                            const matchingConnection = connections.find((connection: any) => {
                                return connection.patient && connection.patient.id === diag.patient_id
                            })

                            if (matchingConnection && matchingConnection.patient) {
                                const linkedPatient: UserConnectionsUser = matchingConnection.patient
                                setCurrentPatient(linkedPatient)
                                onPatientUpdate?.(linkedPatient)
                            } else {
                                setCurrentPatient(null)
                                onPatientUpdate?.(null)
                            }
                        }
                    } catch (error) {
                        // Error loading linked patient - silently handle
                    }
                } else {
                    setCurrentPatient(null)
                    onPatientUpdate?.(null)
                }
            }

            loadLinkedPatient()
        }
    }, [genDiag.id, genDiag.patient_id])

    useEffect(() => {
        const ambientConversationId = JSON.parse(window.localStorage.getItem("acc_t") ?? '""')
        const patientThreadData = JSON.parse(window.localStorage.getItem("aip_t") ?? "{}") as AIPatientThread
        const patientThreadId = patientThreadData.thread_id
        const localDiag = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
        const localSummary = localDiag.summary
        const localDiagnosis: Diagnosis = {
            differential_diagnosis: localDiag.differential_diagnosis,
            alternative_diagnoses: localDiag.alternative_diagnoses
        }

        function formatDateString(date: Date): string {
            const day = ("0" + date.getDate()).slice(-2)
            const month = ("0" + (date.getMonth() + 1)).slice(-2)
            const year = date.getFullYear()
            const hours = ("0" + date.getHours()).slice(-2)
            const minutes = ("0" + date.getMinutes()).slice(-2)

            return `Diagnosis - ${day}-${month}-${year} ${hours}:${minutes}`
        }

        async function createDiagnosisFunc(diagnosis: Diagnosis, summary: string, name?: string) {
            // take raw summary, diagnosis and push
            // trigger a refresh in Navbar and MobileNavbar
            const compoundedDiagnosis: Partial<DoctorDashboardDiagnosis> = {
                differential_diagnosis: {
                    condition: diagnosis.differential_diagnosis.condition,
                    reasoning: diagnosis.differential_diagnosis.reasoning
                },
                summary: summary,
                alternative_diagnoses: diagnosis.alternative_diagnoses,
                name: `${name ? `${name} ` : ""}${formatDateString(new Date())}`,
                patient_id: selectedPatient?.id || null
            }

            const diag = await createDiagnosis(compoundedDiagnosis)

            if (diag) {
                window.localStorage.setItem("diag", JSON.stringify(diag))
                setGenDiag(diag)
                setDiagName(diag.name)
                diagNameRef.current = diag.name
                window.dispatchEvent(new Event("storage"))
            }
        }

        let tempSummary = ""
        let tempDiag = {} as Diagnosis
        console.log(isMounted.current)
        if (
            !isMounted.current &&
            (!patientThreadId || !patientThreadId.length) &&
            (!localSummary || !localSummary.length) &&
            (!localDiagnosis.differential_diagnosis || !localDiagnosis.alternative_diagnoses) &&
            (!ambientConversationId || !ambientConversationId.length)
        ) {
            // Check if this is voice-based diagnosis
            if (audioBlob) {
                setIsVoiceBased(true)
                async function voiceAsyncRunner() {
                    await StreamSummaryFromVoice(
                        audioBlob!,
                        async (message: string) => {
                            // console.log(message)
                            tempSummary = message
                            setRawSummary(tempSummary)
                            setSummary(summaryResponseToJson(tempSummary))
                        },
                        () => {
                            onStreamAuthError()
                            console.log("on voice response error!!!")
                        },
                        async () => {
                            // console.log(tempSummary)
                            // store summary
                            storeSummary(summaryResponseToJson(tempSummary) ?? "")

                            // begin gen diag
                            await StreamDiagnosis(
                                tempSummary,
                                async (message: string) => {
                                    // console.log(message)
                                    tempDiag = diagnosisCompletionResponseToJson(message)
                                    setDiagnosis(tempDiag)
                                },
                                () => {
                                    // store diagnosis
                                    // console.log(tempDiag)
                                    storeDiagnosis(tempDiag)
                                    createDiagnosisFunc(tempDiag, summaryResponseToJson(tempSummary))
                                    window.dispatchEvent(new Event("storage"))
                                    window.dispatchEvent(new Event("diagnosisChanged"))
                                    // clear any previous audio blob at the end of a voice diagnosis
                                    clearAudioBlob?.()
                                },
                                handleInsufficientCredits
                            )
                        },
                        handleInsufficientCredits
                    )
                }
                voiceAsyncRunner().then()
            } else {
                // Text-based diagnosis (existing logic)
                async function asyncRunner() {
                    await StreamSummary(
                        patientData,
                        async (message: string) => {
                            // console.log(message)
                            tempSummary = message
                            setRawSummary(tempSummary)
                            setSummary(summaryResponseToJson(tempSummary))
                        },
                        () => {
                            onStreamAuthError()
                            console.log("on response error!!!")
                        },
                        async () => {
                            // console.log(tempSummary)
                            // store summary
                            storeSummary(summaryResponseToJson(tempSummary) ?? "")

                            // begin gen diag
                            await StreamDiagnosis(
                                tempSummary,
                                async (message: string) => {
                                    // console.log(message)
                                    tempDiag = diagnosisCompletionResponseToJson(message)
                                    setDiagnosis(tempDiag)
                                },
                                () => {
                                    // store diagnosis
                                    // console.log(tempDiag)
                                    storeDiagnosis(tempDiag)
                                    createDiagnosisFunc(tempDiag, summaryResponseToJson(tempSummary))
                                    window.dispatchEvent(new Event("storage"))
                                    window.dispatchEvent(new Event("diagnosisChanged"))
                                },
                                handleInsufficientCredits
                            )
                        },
                        handleInsufficientCredits
                    )
                }
                asyncRunner().then()
            }
        } else if (!isMounted.current && patientThreadId && patientThreadId.length) {
            const asyncAIPatientRunner = async () => {
                await StreamAIPatientSummary(
                    patientThreadId,
                    async (message: string) => {
                        // console.log(message)
                        tempSummary = message
                        setRawSummary(tempSummary)
                        setSummary(summaryResponseToJson(tempSummary))
                    },
                    () => {
                        onStreamAuthError()
                        console.log("on response error!!!")
                    },
                    async () => {
                        // console.log(tempSummary)
                        // store summary
                        storeSummary(summaryResponseToJson(tempSummary) ?? "")

                        window.localStorage.removeItem("aip_t")

                        // begin gen diag
                        await StreamDiagnosis(
                            tempSummary,
                            async (message: string) => {
                                // console.log(message)
                                tempDiag = diagnosisCompletionResponseToJson(message)
                                setDiagnosis(tempDiag)
                            },
                            () => {
                                // store diagnosis
                                // console.log(tempDiag)
                                storeDiagnosis(tempDiag)
                                createDiagnosisFunc(
                                    tempDiag,
                                    summaryResponseToJson(tempSummary),
                                    patientThreadData.connection?.patient?.name
                                )
                                window.dispatchEvent(new Event("storage"))
                                window.dispatchEvent(new Event("diagnosisChanged"))
                            },
                            handleInsufficientCredits
                        )
                    },
                    handleInsufficientCredits
                )
            }

            asyncAIPatientRunner().then()
        } else if (!isMounted.current && ambientConversationId && ambientConversationId.length) {
            const asyncConversationSummaryRunner = async () => {
                await StreamAmbientConversationSummary(
                    ambientConversationId,
                    async (message: string) => {
                        // console.log(message)
                        tempSummary = message
                        setRawSummary(tempSummary)
                        setSummary(summaryResponseToJson(tempSummary))
                    },
                    () => {
                        onStreamAuthError()
                        console.log("on response error!!!")
                    },
                    async () => {
                        storeSummary(summaryResponseToJson(tempSummary) ?? "")

                        window.localStorage.removeItem("acc_t")

                        // begin gen diag
                        await StreamDiagnosis(
                            tempSummary,
                            async (message: string) => {
                                // console.log(message)
                                tempDiag = diagnosisCompletionResponseToJson(message)
                                setDiagnosis(tempDiag)
                            },
                            () => {
                                // store diagnosis
                                // console.log(tempDiag)
                                storeDiagnosis(tempDiag)
                                createDiagnosisFunc(tempDiag, summaryResponseToJson(tempSummary), "Conversation")
                                window.dispatchEvent(new Event("storage"))
                                window.dispatchEvent(new Event("diagnosisChanged"))
                            },
                            handleInsufficientCredits
                        )
                    },
                    handleInsufficientCredits
                )
            }

            asyncConversationSummaryRunner().then()
        } else {
            // use stored data
            setSummary(localSummary)
            setDiagnosis(localDiagnosis)
        }

        isMounted.current = true
    }, [patientData])

    useEffect(() => {
        // console.log(diagnosis)
        scrollToBottom()
    }, [diagnosis])

    useEffect(() => {
        // handle localStorage changes
        const handleStorageChange = async () => {
            const localDiag = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
            const patientThreadId = window.localStorage.getItem("aip_t")
            if (!localDiag.summary && !patientThreadId) setShowDiagnosisPage(false)
            else {
                if (localDiag.name !== diagNameRef.current) {
                    setActiveKey(-1)
                    diagNameRef.current = localDiag.name
                }

                let arr = [false]
                const localClinicalKeys = localDiag.clinical_items
                    ? localDiag.clinical_items.map(lci => Object.keys(lci)[0])
                    : []
                clinicalKeys.forEach((clinicalKey, index) => {
                    if (localClinicalKeys.includes(clinicalKey.value)) arr[index] = true
                })
                setGeneratedKeys(arr)
                setPrimaryDiagnosisIndex(localDiag.primary_index ?? -1)
                setSummary(localDiag.summary)
                setDiagnosis({
                    differential_diagnosis: localDiag.differential_diagnosis,
                    alternative_diagnoses: localDiag.alternative_diagnoses
                })
                setDiagName(localDiag.name)
                setGenDiag(localDiag)

                // Load linked patient when switching diagnoses
                if (localDiag.patient_id) {
                    try {
                        const connections = await getAllConnections()
                        if (connections && Array.isArray(connections)) {
                            const matchingConnection = connections.find((connection: any) => {
                                return connection.patient && connection.patient.id === localDiag.patient_id
                            })

                            if (matchingConnection && matchingConnection.patient) {
                                const linkedPatient: UserConnectionsUser = matchingConnection.patient
                                setCurrentPatient(linkedPatient)
                                onPatientUpdate?.(linkedPatient)
                            }
                        }
                    } catch (error) {
                        // Error loading linked patient - silently handle
                    }
                } else {
                    // Clear patient if diagnosis has no linked patient
                    setCurrentPatient(null)
                    onPatientUpdate?.(null)
                }
            }
        }

        // Listen for both storage events and custom events
        window.addEventListener("storage", handleStorageChange)
        window.addEventListener("diagnosisChanged", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("diagnosisChanged", handleStorageChange)
        }
    }, [])

    return (
        <div className="flex justify-between gap-6 w-full h-full ">
            <div
                style={{ scrollbarWidth: "none" }}
                className="w-full lg:w-2/3 flex lg:gap-4 flex-col h-full bg-gray-100 rounded-tr-xl rounded-tl-xl
                    rounded-bl-none rounded-br-none lg:rounded-xl overflow-hidden">
                <div className="flex gap-4 items-center font-semibold text-md 2xl:text-xl p-4">
                    {/*New Patient*/}
                    <input
                        disabled={!enableDiagNameEditing}
                        type="text"
                        value={diagName ?? "Diagnosis"}
                        onChange={e => {
                            setDiagName(e.target.value)
                        }}
                        className={`w-5/6 py-1 sm:text-lg outline-none rounded px-2 
                            ${enableDiagNameEditing ? "italic bg-white font-light" : ""}`}
                    />

                    <div>
                        <AnimatePresence mode="wait">
                            {enableDiagNameEditing ? (
                                <motion.div
                                    className="text-gray-500"
                                    key="enable-diag-name-edit"
                                    initial={{ opacity: 0, x: "-20%" }}
                                    animate={{ opacity: 1, x: "0%" }}
                                    exit={{ opacity: 0, x: "-20%" }}
                                    transition={{ duration: 0.1 }}>
                                    <div className="flex gap-3">
                                        <div
                                            role="button"
                                            className="p-1"
                                            onClick={() => {
                                                setDiagName(genDiag.name)
                                                setEnableDiagNameEditing(false)
                                            }}>
                                            <CgClose size={22} />
                                        </div>
                                        <div
                                            role="button"
                                            className="p-1"
                                            onClick={() => {
                                                // update the diag object
                                                updateDiagName()
                                                setEnableDiagNameEditing(false)
                                            }}>
                                            <FaCheck size={22} />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    role="button"
                                    onClick={() => setEnableDiagNameEditing(true)}
                                    className="p-1"
                                    key="disable-diag-name-edit"
                                    initial={{ opacity: 0, x: "20%" }}
                                    animate={{ opacity: 1, x: "0%" }}
                                    exit={{ opacity: 0, x: "20%" }}
                                    transition={{ duration: 0.1 }}>
                                    <AiOutlineEdit size={22} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div
                    // style={{scrollbarWidth: "none"}}
                    className={"overflow-y-auto w-full h-full bg-blue-50"}>
                    <div className={"rounded-3xl w-full p-1 2xl:p-8"}>
                        <MessagesField>
                            {!summary && <LoadingDiagnosis loadingText="Getting Summary..." />}
                            {summary && <SendSummary message={summary} rawSummary={rawSummary} />}
                            {summary && diagnosis && (
                                <ReceiveDiagnosis
                                    diagnosis={diagnosis}
                                    summary={summary}
                                    rawSummary={rawSummary}
                                    primaryDiagnosisIndex={primaryDiagnosisIndex}
                                    setPrimaryDiagnosisIndex={setPrimaryDiagnosisIndex}
                                />
                            )}
                        </MessagesField>

                        <div ref={messagesEndRef} />

                        <div className={"pt-8 pb-10 px-4"}>
                            {clinicalKeys.map((cKey, index) => (
                                <div
                                    key={index}
                                    className={`flex flex-col gap-2 w-full ${activeKey == index && "mt-6"}`}>
                                    {activeKey == index && <MessageAvatar user={"fornix"} />}
                                    <div className={`${activeKey == index && styles.receiveMessage} rounded-xl`}>
                                        {generatedKeys[index] && (
                                            <div className={`flex flex-col gap-2 w-full pt-6`}>
                                                <div
                                                    onClick={() => {
                                                        setActiveKey(prevState => (prevState != index ? index : -1))
                                                    }}
                                                    className={`text-lg px-8 flex justify-between 
                                                    ${activeKey != index ? " text-gray-500 " : " font-semibold "}`}>
                                                    {cKey.name}
                                                    {activeKey == index ? (
                                                        <FaAngleUp size={20} />
                                                    ) : (
                                                        <FaAngleDown size={20} />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {activeKey == index && (
                                            <div className={"pb-6"}>
                                                <ClinicalItem
                                                    clinicalKey={cKey}
                                                    diagnosis={diagnosis}
                                                    primaryDiagnosisIndex={primaryDiagnosisIndex}
                                                    summary={summary?.length ? summary : rawSummary}
                                                    handleInsufficientCredits={handleInsufficientCredits}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="lg:hidden h-16" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block rounded-xl w-1/3 2xl:w-96 h-full 2xl:p-4 overflow-hidden">
                <div className="mb-6 px-1 mt-1">
                    <PatientSelector
                        className="w-full"
                        buttonClassName="w-full py-3 text-center justify-center"
                        selectedPatient={currentPatient}
                        onPatientSelect={handlePatientLink}
                        onPatientClear={() => handlePatientLink(null)}
                    />
                </div>
                <div className="flex flex-col pb-4">
                    <p
                        className="uppercase rounded-t-xl bg-amber-100 p-3 font-semibold text-gray-700 text-sm 2xl:text-md
                    tracking-wide">
                        Others
                    </p>
                    {clinicalKeys.map((clinicalKey, index) => (
                        <div
                            key={index}
                            className={`bg-amber-100 px-3 py-2 ${index === clinicalKeys.length - 1 && "pb-4 mb-8 rounded-b-xl"}`}>
                            <div
                                role="button"
                                onClick={() => {
                                    let arr = generatedKeys
                                    arr[index] = true
                                    setGeneratedKeys(arr)
                                    setActiveKey(index)
                                }}
                                key={index}
                                className={`flex h-12 justify-between items-center gap-2 px-3 py-2 text-xs 2xl:text-sm 
                                    rounded-md transition duration-200 select-none ${
                                        generatedKeys[index]
                                            ? " bg-amber-50 text-yellow-600 "
                                            : " bg-gray-50 text-gray-600 "
                                    }`}>
                                <div className="flex gap-2 items-center">
                                    {clinicalKey.name}
                                    {/*<CiCircleInfo size={18}/>*/}
                                </div>
                                {generatedKeys[index] && (
                                    <div className="bg-green-300 text-white rounded-lg p-1">
                                        <IoMdCheckmark size={20} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/*mobile clinical items backdrop blur view*/}
            <AnimatePresence>
                {showMobileClinicalMenu && (
                    <motion.div
                        key="mobile-menu-backdrop-blur"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-10 backdrop-blur-sm bg-gray-300
                            bg-opacity-10"
                    />
                )}
            </AnimatePresence>

            {/*mobile clinical items view*/}
            <div
                className={`z-20 lg:hidden absolute left-0 right-0 mx-auto bottom-8 w-5/6 h-fit flex flex-col 
                    items-center justify-end`}>
                <PatientSelector
                    className="w-full mb-2"
                    buttonClassName="w-full py-3 text-center justify-center bg-gray-50"
                    selectedPatient={currentPatient}
                    onPatientSelect={handlePatientLink}
                    onPatientClear={() => handlePatientLink(null)}
                />
                <div
                    className={`w-full max-w-7xl py-2 flex flex-col items-center gap-2 text-gray-800 bg-amber-100
                         rounded-lg font-bold border border-white transition-all duration-500 shadow-lg
                         ${showMobileClinicalMenu ? "" : "justify-center"}`}
                    onClick={() => {
                        setShowMobileClinicalMenu(prev => !prev)
                    }}>
                    <div
                        className={`w-full px-4 flex justify-center items-center transition-all duration-100 max-h-[50vh]
                                  ${showMobileClinicalMenu ? " h-[20rem] " : " h-8 "}`}>
                        <AnimatePresence mode="wait">
                            {showMobileClinicalMenu ? (
                                <motion.div
                                    key="others-text"
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className=" w-full h-full flex flex-col gap-3 justify-center items-center">
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <p>Others</p>
                                            <HiOutlineSparkles size={20} />
                                        </div>
                                        <CgClose size={30} />
                                    </div>

                                    <div className="w-full h-full overflow-y-scroll">
                                        {showMobileClinicalMenu && (
                                            <div className="w-full flex flex-col gap-3 overflow-y-auto">
                                                {clinicalKeys.map((clinicalKey, index) => (
                                                    <div
                                                        role="button"
                                                        onClick={() => {
                                                            let arr = generatedKeys
                                                            arr[index] = true
                                                            setGeneratedKeys(arr)
                                                            setActiveKey(index)
                                                        }}
                                                        key={index}
                                                        className={`w-full flex h-10 justify-between items-center gap-2 px-3 py-2 
                                                            text-xs rounded-md transition duration-100 select-none bg-gray-50
                                                            ${generatedKeys[index] ? " text-gray-900 " : " text-gray-500 "}`}>
                                                        <div className="w-full flex gap-2 items-center">
                                                            <p className="max-w-4/5 overflow-hidden text-nowrap text-ellipsis">
                                                                {clinicalKey.name}
                                                            </p>
                                                            {/*<CiCircleInfo size={12}/>*/}
                                                        </div>
                                                        {/*{generatedKeys[index] &&*/}
                                                        {/*    <div className='bg-green-300 text-white rounded p-1'>*/}
                                                        {/*        <IoMdCheckmark size={10}/></div>}*/}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="gen-others-text"
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="flex gap-2 justify-center items-center">
                                    <HiOutlineSparkles size={20} />
                                    <span>Generate others</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

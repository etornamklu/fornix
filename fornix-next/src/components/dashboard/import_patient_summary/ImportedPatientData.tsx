import React, { SetStateAction, useEffect, useRef, useState } from "react"
import { AIPatientThread, DashboardPath, PatientData, PatientMedicalNotes, UserConnection } from "@/utils/types"
import { getNarrativePatientData } from "@/services/dashboard/patient_data.service"
import { motion, AnimatePresence } from "framer-motion"
import Button from "@/components/global/Button"
import { IoIosArrowBack } from "react-icons/io"
import { FaStethoscope } from "react-icons/fa6"
import Link from "next/link"
import { getPatientThreadIds } from "@/services/dashboard/threads.service"
import { useResponseAuth } from "@/utils/auth.client"
import { convertNarrativeResponseToJson } from "@/utils/dashboard/patient_data"
import LoadingDiagnosis from "@/components/dashboard/patient_diagnosis/generate_diagnosis/LoadingDiagnosis"

export const ImportedPatientData = ({ setPage }: { setPage: React.Dispatch<SetStateAction<number>> }) => {
    const [narrativeData, setNarrativeData] = useState({} as PatientMedicalNotes)
    const [userThreads, setUserThreads] = useState<AIPatientThread[]>([])
    const connectionData = useRef<UserConnection>()
    const [loadingData, setLoadingData] = useState(false)
    const onStreamAuthError = useResponseAuth()

    // Check if patient data is available
    const hasPatientData = !!(
        narrativeData.demographics?.name ||
        narrativeData.demographics?.age ||
        narrativeData.chief_complaint ||
        narrativeData.history_of_present_illness ||
        narrativeData.review_of_systems ||
        narrativeData.past_medical_history ||
        narrativeData.medication_history ||
        narrativeData.social_history ||
        narrativeData.family_history
    )

    const handleGetDiagnosis = () => {
        if (!hasPatientData || loadingData) return

        const temp = { ...userThreads[0], connection: connectionData.current }
        localStorage.setItem("aip_t", JSON.stringify(temp))
        localStorage.removeItem("diag")
        window.dispatchEvent(new Event("storage"))
    }

    useEffect(() => {
        const handleStorageChange = () => {
            const patientId = localStorage.getItem("aip_id")
            if (!patientId) return

            // getPatientThreadIds(patientId).then(threads => setUserThreads(threads as AIPatientThread[]))

            setLoadingData(true)
            getNarrativePatientData(
                patientId,
                message => setNarrativeData(convertNarrativeResponseToJson(message)),
                () => {
                    // onStreamAuthError()
                    setLoadingData(false)
                },
                () => setLoadingData(false)
            )

            // const stored = JSON.parse(localStorage.getItem("aip_t") || "{}") as { connection?: UserConnection }
            // if (stored.connection?.id) connectionData.current = stored.connection
            // localStorage.removeItem("aip_id")
            // localStorage.removeItem("aip_t")
        }

        handleStorageChange()
        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [])

    const DiagnosisButton = () => {
        const isDisabled = !hasPatientData || loadingData

        if (isDisabled) {
            return (
                <Button disabled className={`flex gap-1 opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400`}>
                    <FaStethoscope size={15} />
                    Get Diagnosis
                </Button>
            )
        }

        return (
            <Link href={`/dashboard${DashboardPath.Diagnosis}`}>
                <Button onClick={handleGetDiagnosis} className="flex gap-1">
                    <FaStethoscope size={15} />
                    Get Diagnosis
                </Button>
            </Link>
        )
    }

    return (
        <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full flex flex-col overflow-y-hidden">
            <div className="w-full lg:w-4/5 2xl:w-2/3 mx-auto flex p-1 py-1.5 justify-between items-center bg-gray-50 lg:bg-gray-200 rounded-md shadow-md lg:shadow-none">
                <button className="flex text-blue-600 p-1 gap-1" onClick={() => setPage(0)}>
                    <IoIosArrowBack size={20} />
                    <span className="hidden lg:block">Back</span>
                </button>
                <DiagnosisButton />
            </div>

            <motion.div
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white w-full h-full lg:w-4/5 2xl:w-2/3 mx-auto p-6 mb-2 space-y-4 rounded-lg mt-2 overflow-y-auto">
                <h1 className="text-3xl text-gray-800 font-bold text-center mb-6">Patient Data</h1>

                <div>
                    <strong className="text-xl">Demographic Details</strong>
                    {narrativeData.demographics?.name && (
                        <p>
                            <strong>Name:</strong> {narrativeData.demographics.name}
                        </p>
                    )}
                    {narrativeData.demographics?.residence && (
                        <p>
                            <strong>Address:</strong> {narrativeData.demographics.residence}
                        </p>
                    )}
                    {narrativeData.demographics?.age != null && (
                        <p>
                            <strong>Age:</strong> {narrativeData.demographics.age}
                        </p>
                    )}
                    {narrativeData.demographics?.gender && (
                        <p>
                            <strong>Gender:</strong> {narrativeData.demographics.gender}
                        </p>
                    )}
                </div>

                <AnimatePresence>
                    {loadingData && (
                        <motion.div
                            key="loading-diagnosis"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex py-5 justify-center">
                            <LoadingDiagnosis loadingText="Analyzing patient data" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="w-full">
                    <AnimatePresence>
                        {!loadingData && !hasPatientData ? (
                            <motion.div
                                key="no-data"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <p className="text-lg font-medium">
                                    No patient data available.
                                    <br />
                                    Please inform user to fill the patient questionnaire.
                                </p>
                                <button
                                    onClick={() => setPage(0)}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md shadow">
                                    Go Back
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="patient-data"
                                layout
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={`w-full flex flex-col gap-5 ${
                                    loadingData
                                        ? "blur text-gray-400 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                                        : ""
                                }`}>
                                {narrativeData.chief_complaint && (
                                    <div className="w-full">
                                        <strong>Chief Complaint:</strong>
                                        <p>{narrativeData.chief_complaint}</p>
                                    </div>
                                )}

                                {narrativeData.history_of_present_illness && (
                                    <div className="w-full">
                                        <strong>HPC:</strong>
                                        <p>{narrativeData.history_of_present_illness}</p>
                                    </div>
                                )}

                                {narrativeData.review_of_systems && (
                                    <div className="w-full">
                                        <strong>Systemic Enquiry:</strong>
                                        <div>
                                            {narrativeData.review_of_systems.split("\n").map((line, index) => (
                                                <p key={index} className="mb-1">
                                                    {line.trim()}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {narrativeData.past_medical_history && (
                                    <div className="w-full">
                                        <strong>Past Medical History:</strong>
                                        <p>{narrativeData.past_medical_history}</p>
                                    </div>
                                )}

                                {narrativeData.medication_history && (
                                    <div className="w-full">
                                        <strong>Drugs and Allergies History:</strong>
                                        <p>{narrativeData.medication_history}</p>
                                    </div>
                                )}

                                {narrativeData.social_history && (
                                    <div className="w-full">
                                        <strong>Social History:</strong>
                                        <p>{narrativeData.social_history}</p>
                                    </div>
                                )}

                                {narrativeData.family_history && (
                                    <div className="w-full">
                                        <strong>Family History:</strong>
                                        <p>{narrativeData.family_history}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    )
}

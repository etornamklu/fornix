import { PatientDataForm } from "@/components/dashboard/patient_diagnosis/PatientDataForm"
import React, { useEffect, useRef, useState } from "react"
import { DiagnosisStreamProps, DoctorDashboardDiagnosis, SummaryItem, UserConnectionsUser } from "@/utils/types"
import { SingleValue } from "react-select"
import { GenerateDiagnosis } from "@/components/dashboard/patient_diagnosis/generate_diagnosis/GenerateDiagnosis"
import { clearAllDiagnosisData, StreamSummaryFromVoice, StreamDiagnosis } from "@/services/dashboard/diagnosis.service"
import { CgClose } from "react-icons/cg"
import Subscription from "@/components/patients/settings/Subscription"

import { motion } from "framer-motion"

import PatientSelector from "@/components/global/PatientSelector"

const InsufficientCreditsAlert = ({
    setShowInsufficientCreditsAlert
}: {
    setShowInsufficientCreditsAlert: (b: boolean) => void
}) => {
    return (
        <div className="fixed p-4 lg:p-20 z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-lg">
            <div className="relative h-3/5 bg-white p-8 rounded-lg shadow-lg">
                <div
                    role="button"
                    onClick={() => {
                        setShowInsufficientCreditsAlert(false)
                    }}
                    className="absolute -top-16 right-0 lg:-right-16 flex items-center justify-center transition duration-300
                        hover:-rotate-12">
                    <CgClose size={60} className="text-white" />
                </div>

                <div className="flex flex-col h-full gap-8">
                    <div className="text-lg lg:text-3xl text-rose-500 font-semibold">
                        You have run out of credits. Purchase more for continued access.
                    </div>
                    <div className="overflow-y-auto h-full pb-2">
                        <Subscription smallView={true} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export const PatientDiagnosis = () => {
    const [textValues, setTextValues] = useState([""])
    const [showDiagnosisPage, setShowDiagnosisPage] = useState(false)
    const [patientData, setPatientData] = useState({} as DiagnosisStreamProps)
    const [showInsufficientCreditsAlert, setShowInsufficientCreditsAlert] = useState(false)
    const isMounted = useRef(false)
    const [genDiagKey, setGenDiagKey] = useState(0)

    const [selectedPatient, setSelectedPatient] = useState<UserConnectionsUser | null>(null)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

    const handleInsufficientCredits = () => {
        setShowInsufficientCreditsAlert(true)
        setShowDiagnosisPage(false)
    }

    // Simple function to extract age and gender from text
    const extractAgeAndGender = (text: string) => {
        const lowerText = text.toLowerCase()

        // Extract age (look for patterns like "45-year-old", "45 years old", "age 45", etc.)
        const ageMatch =
            text.match(/(\d+)[\s-]*(?:year|yr|y)[\s-]*(?:old|of age)?/i) ||
            text.match(/age[\s:]*(\d+)/i) ||
            text.match(/(\d+)[\s-]*(?:years?|yrs?)[\s-]*(?:old|of age)?/i)

        // Extract gender
        const genderMatch = lowerText.match(/\b(male|female|man|woman|boy|girl|m|f)\b/)

        const age = ageMatch ? ageMatch[1] : "0"
        let gender = "male" // default

        if (genderMatch) {
            const genderText = genderMatch[1]
            if (["female", "woman", "girl", "f"].includes(genderText)) {
                gender = "female"
            } else if (["male", "man", "boy", "m"].includes(genderText)) {
                gender = "male"
            }
        }

        return { age, gender }
    }

    const handleGenerateDiagnosis = () => {
        clearAllDiagnosisData()

        // Extract age and gender from the text input
        const { age, gender } = extractAgeAndGender(textValues[0])

        // move to gen diagnosis if data valid
        // - gen diagnosis auto begins generating summary
        setPatientData({
            age: `${age} years`,
            sex: gender,
            complaint_and_duration: textValues[0],
            symptoms_history: textValues[0], // Use the same text for all fields since it's now a single input
            med_history: textValues[0],
            social_family_history: textValues[0],
            clinical_studies: textValues[0]
        })

        // Clear the form after generating diagnosis
        setTextValues([""])

        setShowDiagnosisPage(true)
    }

    const handleVoiceDiagnosis = async (audioBlob: Blob) => {
        clearAllDiagnosisData()

        // Store the audio blob for the GenerateDiagnosis component to use
        setAudioBlob(audioBlob)

        // Set up voice-based patient data (we'll extract age/gender from the voice summary)
        setPatientData({
            age: "0 years", // Will be updated from voice summary
            sex: "male", // Will be updated from voice summary
            complaint_and_duration: "", // Will be populated from voice summary
            symptoms_history: "", // Will be populated from voice summary
            med_history: "", // Will be populated from voice summary
            social_family_history: "", // Will be populated from voice summary
            clinical_studies: "" // Will be populated from voice summary
        })

        setShowDiagnosisPage(true)
    }

    // useEffect(() => {
    //     setGenDiagKey(Math.random())
    // }, [patientData])

    useEffect(() => {
        // if (!isMounted.current)
        //     window.history.pushState(null, 'Patient Diagnosis', '/dashboard/diagnosis')
        // isMounted.current = true
        const sm = (JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis).summary
        if (sm && sm.length) setShowDiagnosisPage(true)
        else setShowDiagnosisPage(false)
    }, [])

    useEffect(() => {
        // check for changes in stored summary and diagnosis and update
        const handleStorageChange = () => {
            // if (not showDiagnosisPage) and stored data: show diagnosis page
            if (!showDiagnosisPage) {
                if (localStorage.getItem("diag")) {
                    localStorage.removeItem("aip_t")
                    localStorage.removeItem("acc_t")
                    setShowDiagnosisPage(true)
                } else if (localStorage.getItem("aip_t")) {
                    localStorage.removeItem("diag")
                    localStorage.removeItem("acc_t")
                    setPatientData({} as DiagnosisStreamProps)
                    setShowDiagnosisPage(true)
                } else if (localStorage.getItem("acc_t")) {
                    localStorage.removeItem("aip_t")
                    localStorage.removeItem("diag")
                    setPatientData({} as DiagnosisStreamProps)
                    setShowDiagnosisPage(true)
                }
            }
        }

        handleStorageChange()

        window.addEventListener("storage", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [])

    // anmimating component on mount
    const slideInAnimation = {
        hidden: { x: "-20%", opacity: 0 },
        visible: { x: "0%", opacity: 1 }
    }

    const scaleAnimation = {
        hidden: { scale: 0.95, opacity: 0 },
        visible: { scale: 1, opacity: 1 }
    }

    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    return (
        <motion.div
            className="w-full flex flex-col h-full lg:justify-center items-center gap-14"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeAnimation}
            // transition={{ duration: 0.1, ease: "easeIn" }}
        >
            {/*{showInsufficientCreditsAlert && (*/}
            {/*    <InsufficientCreditsAlert setShowInsufficientCreditsAlert={setShowInsufficientCreditsAlert} />*/}
            {/*)}*/}

            {showDiagnosisPage ? (
                <GenerateDiagnosis
                    key={genDiagKey}
                    patientData={patientData}
                    setShowDiagnosisPage={setShowDiagnosisPage}
                    handleInsufficientCredits={handleInsufficientCredits}
                    selectedPatient={selectedPatient}
                    onPatientUpdate={setSelectedPatient}
                    audioBlob={audioBlob || undefined}
                    clearAudioBlob={() => setAudioBlob(null)}
                />
            ) : (
                <div className="px-1 lg:px-0 pb-16 lg:pb-0 overflow-y-auto">
                    <div className="flex flex-col justify-center items-center gap-1 2xl:gap-6">
                        <div className="hidden lg:flex 2xl:flex-col text-3xl 2xl:text-6xl justify-center items-center gap-2">
                            <span className="font-semibold">Analyze your patient&apos;s</span>
                            <span className="italic text-blue-500 font-semibold">history</span>
                        </div>

                        {/*for mobile view*/}
                        <div className="flex pt-5 lg:hidden flex-col text-3xl justify-center items-center">
                            <span className="font-bold">Analyze your</span>
                            <span className="italic text-blue-500 font-bold">patient&apos;s history</span>
                        </div>

                        <span className="text-gray-700 2xl:text-lg mb-8 flex text-center">
                            Enter patient symptoms to get diagnoses and clinical management plan
                        </span>
                    </div>
                    <div className="w-full"></div>
                    <PatientDataForm
                        handleGenerateDiagnosis={handleGenerateDiagnosis}
                        handleVoiceDiagnosis={handleVoiceDiagnosis}
                        textValues={textValues}
                        setTextValues={setTextValues}
                    />
                </div>
            )}
        </motion.div>
    )
}

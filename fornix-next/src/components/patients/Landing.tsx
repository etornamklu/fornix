import React, { useEffect, useState } from "react"
import { DashboardPath, LogoVariants, PatientMedicalData } from "@/utils/types"
import { useQuestionnaireHistoryStore } from "../../../store/questionaireHistoryStore"
import useAuthStore from "../../../store/AuthStore"
import { useTabStore } from "../../../store/TabStore"
import { useRouter } from "next/navigation"
import { LogoAsset } from "@/components/assets/LogoAsset"
import { AnimatePresence, motion } from "framer-motion"
import { FiChevronDown, FiPlus } from "react-icons/fi"
import { getPatientData } from "@/services/dashboard/patient_data.service"
import Link from "next/link"

interface ILandingPageProps {
    setShowPhoneMenu?: React.Dispatch<React.SetStateAction<boolean>>
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)

    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric"
    }

    const formattedDate = date.toLocaleDateString("en-US", options)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${formattedDate} - ${hours}:${minutes}`
}

// ...imports remain unchanged

const PatientLandingPage = ({}: ILandingPageProps) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()
    const router = useRouter()

    const setQuestionnaireId = useQuestionnaireHistoryStore(state => state.setQuestionnaireId)
    const { previousConversations } = useQuestionnaireHistoryStore()

    const convList = Array.isArray(previousConversations) ? previousConversations : (previousConversations ?? [])
    const [conversationsExpanded, setConversationsExpanded] = useState(false)

    const convToShow = conversationsExpanded ? convList : convList.slice(0, 2)
    const [patientData, setPatientData] = useState({} as PatientMedicalData)

    useEffect(() => {
        const updatePatientData = async () => {
            const pd = (await getPatientData()) as PatientMedicalData
            setPatientData(pd)
        }

        updatePatientData()
    }, [])

    return (
        <main className="w-full h-full bg-transparent">
            <div className="w-full 2xl:w-3/5 h-full flex flex-col gap-5 overflow-y-auto mobile-diagnosis-form-scrollbar rounded-lg">
                {/* Conversations Section */}
                {convList.length > 0 ? (
                    <section className="p-4 w-full flex flex-col gap-4 bg-white rounded-lg">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => {
                                setConversationsExpanded(!conversationsExpanded)
                            }}>
                            <h1 className="text-xl font-semibold">My History</h1>
                            {convList.length > 2 && (
                                <FiChevronDown
                                    className={`transition-transform duration-200 ${conversationsExpanded ? "rotate-180" : ""}`}
                                    size={24}
                                />
                            )}
                        </div>

                        <motion.div layout className="flex flex-col gap-2">
                            <AnimatePresence initial={false}>
                                {convToShow.map((conv, idx) => (
                                    <motion.div
                                        key={idx}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full p-3 border border-gray-200 rounded-lg">
                                        {conv?.created_at ? formatDate(conv.created_at) : "No date available"}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        <motion.div layout className="mt-4">
                            <Link
                                href={`/dashboard${DashboardPath.Condition}`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white transition-all duration-200">
                                <FiPlus />
                                Start new session
                            </Link>
                        </motion.div>
                    </section>
                ) : (
                    <p className="text-gray-500">No conversations to display.</p>
                )}

                {/* Medical Records Section */}
                {patientData.chief_complaints?.length ? (
                    <section className="p-4 w-full flex flex-col gap-4 bg-white rounded-lg">
                        <div className="flex items-center justify-between cursor-pointer">
                            <h1 className="text-xl font-semibold">My Medical Record</h1>
                        </div>

                        <div className="flex flex-1 w-full">
                            <div className="columns-2 xl:columns-3 gap-x-4 gap-y-4 w-full [&_p]:text-gray-600 [&_h3]:uppercase [&_h3]:text-xs [&_h3]:font-semibold [&_p]:capitalize [&_h3]:tracking-wider">
                                {!!patientData.personal_info?.firstname && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Full Name</h3>
                                        <p>
                                            {patientData.personal_info.firstname} {patientData.personal_info.lastname}
                                        </p>
                                    </div>
                                )}

                                {!!patientData.personal_info?.gender && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Gender</h3>
                                        <p>{patientData.personal_info.gender}</p>
                                    </div>
                                )}

                                {!!patientData.medical_history?.[0]?.general?.previous_illnesses?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Past Medical History</h3>
                                        <p>{patientData.medical_history[0].general.previous_illnesses.join(", ")}</p>
                                    </div>
                                )}

                                {!!patientData.drug_history_and_allergies?.[0]?.allergies?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Allergies</h3>
                                        <p>
                                            {patientData.drug_history_and_allergies[0].allergies
                                                .map(al => al.allergen)
                                                .join(", ")}
                                        </p>
                                    </div>
                                )}

                                {!!patientData.drug_history_and_allergies?.[0]?.medicines?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Medications</h3>
                                        <p>
                                            {patientData.drug_history_and_allergies[0].medicines
                                                .map(m => m.name)
                                                .join(", ")}
                                        </p>
                                    </div>
                                )}

                                {!!patientData.drug_history_and_allergies?.[0]?.upset_medicines?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Adverse Drug Reactions</h3>
                                        <div className="flex flex-col gap-3 m-1">
                                            {patientData.drug_history_and_allergies[0].upset_medicines.map(
                                                (um, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex flex-col gap-1 border border-gray-200 rounded-lg py-2 px-3">
                                                        <span className="text-gray-600">{um.name}</span>
                                                        <span className="text-sm">{um.reaction}</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!!patientData.drug_history_and_allergies?.[0]?.therapies?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Therapies</h3>
                                        <div className="flex flex-col gap-3 m-1">
                                            {patientData.drug_history_and_allergies[0].therapies.map((um, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col gap-1 border border-gray-200 rounded-lg py-2 px-3">
                                                    <span className="text-gray-600">{um.type}</span>
                                                    <span className="text-sm">{um.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!!patientData.medical_history?.[0]?.surgical?.surgeries?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Surgical History</h3>
                                        <p>{patientData.medical_history[0].surgical.surgeries.join(", ")}</p>
                                    </div>
                                )}

                                {!!patientData.family_history?.hereditary_conditions?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Hereditary Conditions</h3>
                                        <p>{patientData.family_history.hereditary_conditions.join(", ")}</p>
                                    </div>
                                )}

                                {!!patientData.family_history?.family_members?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Family History</h3>
                                        <div className="flex flex-col gap-3 m-1">
                                            {patientData.family_history.family_members.map((um, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col gap-1 border border-gray-200 rounded-lg py-2 px-3 uppercase">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-700">
                                                            {um.relation},{" "}
                                                            <span className="text-gray-600">{um.age}</span>
                                                        </span>
                                                        <span className="text-xs">
                                                            {um.alive ? (
                                                                <span className="text-green-700">alive</span>
                                                            ) : (
                                                                <span className="text-rose-700">not alive</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{um.current_illnesses?.join(", ")}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!!patientData.social_history?.travel_history?.locations?.length && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Travel History</h3>
                                        <p>{patientData.social_history.travel_history.locations.join(", ")}</p>
                                    </div>
                                )}

                                {/* NEW SOCIAL HISTORY BLOCK */}
                                {!!(
                                    patientData?.social_history?.alcohol_history ||
                                    patientData?.social_history?.smoking_history
                                ) && (
                                    <div className="mb-4 break-inside-avoid shadow p-3 border border-gray-200 rounded-lg">
                                        <h3>Social History</h3>
                                        <div className="flex flex-col gap-3">
                                            {!!patientData.social_history?.alcohol_history && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700">Alcohol</h4>
                                                    <p>
                                                        {patientData.social_history.alcohol_history?.drinks_alcohol
                                                            ? "Takes alcohol"
                                                            : "Doesn't take alcohol"}
                                                    </p>
                                                    {patientData.social_history.alcohol_history?.units_per_day_week && (
                                                        <p>
                                                            Units/day or week:{" "}
                                                            {
                                                                patientData.social_history.alcohol_history
                                                                    .units_per_day_week
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {!!(
                                                patientData.social_history?.smoking_history?.currently_smokes ||
                                                patientData.social_history?.smoking_history?.previously_smoked
                                            ) && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700">Smoking</h4>
                                                    <p>
                                                        {patientData.social_history.smoking_history?.previously_smoked
                                                            ? "Previously smoked"
                                                            : "Has not smoked previously"}
                                                    </p>
                                                    <p>
                                                        {patientData.social_history.smoking_history?.currently_smokes
                                                            ? "Currently smokes"
                                                            : "Does not currently smoke"}
                                                    </p>
                                                    {patientData.social_history.smoking_history?.quit_reason && (
                                                        <p>
                                                            Quit Reason:{" "}
                                                            {patientData.social_history.smoking_history.quit_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ) : (
                    <p className="text-gray-500">No medical records to display.</p>
                )}
            </div>
        </main>
    )
}

export default PatientLandingPage

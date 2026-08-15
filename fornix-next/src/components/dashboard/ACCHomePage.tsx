import React from "react"
import { DashboardPath } from "@/utils/types"
import { FaStethoscope, FaNotesMedical, FaFileMedicalAlt } from "react-icons/fa"
import { CiImport } from "react-icons/ci"
import { HiOutlineSparkles } from "react-icons/hi2"
import { RiVoiceprintFill } from "react-icons/ri"
import { GiScalpel, GiNotebook } from "react-icons/gi"
import { AiOutlineFileText } from "react-icons/ai"
import { FiSend } from "react-icons/fi"
import { useTabStore } from "../../../store/TabStore"
import Link from "next/link"
import useAuthStore from "../../../store/AuthStore"

interface ACCHomePageProps {}

const ACCHomePage = ({}: ACCHomePageProps) => {
    const { activeTab, setActiveTab } = useTabStore()
    const { auth } = useAuthStore()

    const features = [
        {
            title: "Physical Examination",
            icon: <FaStethoscope className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.Examination
        },
        {
            title: "History Taking",
            icon: <CiImport className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.HistoryTaking
        },
        // {
        //     title: "MedFind",
        //     icon: <HiOutlineSparkles className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
        //     tab: DashboardPath.MedFind
        // },
        // {
        //     title: "Ambient Conversation Capture",
        //     icon: <RiVoiceprintFill className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
        //     tab: DashboardPath.Conversation
        // },
        {
            title: "Progress Note / Ward Rounds",
            icon: <FaNotesMedical className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.ProgressNotes
        },
        {
            title: "Operative Note / Surgical Note",
            icon: <GiScalpel className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.OperativeNotes
        },
        {
            title: "Admission Note / Clerking Template",
            icon: <GiNotebook className="text-blue-500 w-6 h-6 sm:w-7 sm:h-7" />,
            tab: DashboardPath.AdmissionNotes
        },
        {
            title: "Discharge Summary",
            icon: <AiOutlineFileText className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.DischargeSummary
        },
        {
            title: "Procedure Note (Non‐Surgical)",
            icon: <FaFileMedicalAlt className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.ProcedureNote
        },
        {
            title: "Referral Note",
            icon: <FiSend className="text-blue-500 w-3 h-3 sm:w-7 sm:h-7" />,
            tab: DashboardPath.ReferralNotes
        }
    ]

    return (
        <main className="w-full max-h-screen flex flex-col items-center bg-transparent pb-2 overflow-auto">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 px-4 sm:px-6 md:px-8 text-center">
                <div className="flex flex-col items-center mb-2 mt-4">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                        Welcome to <span className="text-blue-500">Ambient Conversation Capture</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                    {features.map((feature, index) => (
                        <Link
                            href={`/dashboard/acc${feature.tab}`}
                            key={index}
                            onClick={() => setActiveTab(feature.tab)}
                            className="flex flex-col items-center justify-center bg-blue-50 h-14 sm:h-40 p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-100 cursor-pointer transition-all">
                            <div className="mb-2 sm:mb-3">{feature.icon}</div>
                            <h2 className="text-sm sm:text-base font-semibold text-blue-600 text-center">
                                {feature.title}
                            </h2>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}

export default ACCHomePage

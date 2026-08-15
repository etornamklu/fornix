import React from "react"
import { DashboardPath } from "@/utils/types"
import { FaStethoscope } from "react-icons/fa6"
import { CiImport } from "react-icons/ci"
import { HiOutlineSparkles } from "react-icons/hi2"
import { RiVoiceprintFill } from "react-icons/ri"
import { useTabStore } from "../../../store/TabStore"
import Link from "next/link"
import useAuthStore from "../../../store/AuthStore"

interface IDoctorLandingPageProps {
    // setActiveTab: React.Dispatch<React.SetStateAction<DashboardPath>>;
}

const DoctorLandingPage = ({}: IDoctorLandingPageProps) => {
    const { activeTab, setActiveTab } = useTabStore()
    const { auth } = useAuthStore()

    let features = [
        {
            title: "Patient Diagnosis",
            description:
                "Enter patient symptoms to receive likely diagnoses, differential diagnoses, treatment recommendations, and decision support for investigations and prescriptions.",
            icon: <FaStethoscope size={28} className="text-blue-500" />, // Smaller size for better responsiveness
            tab: DashboardPath.Diagnosis
        },
        {
            title: "Import Patient Summary",
            description:
                "Access structured patient histories collected through conversational AI before consultations.",
            icon: <CiImport size={28} className="text-blue-500" />,
            tab: DashboardPath.ImportSummary
        },
        {
            title: "MedFind",
            description:
                "An AI-driven medical knowledge assistant providing accurate, referenced clinical information for quick decision-making.",
            icon: <HiOutlineSparkles size={28} className="text-blue-500" />,
            tab: DashboardPath.MedFind
        },
        {
            title: "Ambient Conversation Capture",
            description:
                "AI transcribes and structures patient interactions into a medical history format for easy documentation.",
            icon: <RiVoiceprintFill size={28} className="text-blue-500" />,
            tab: DashboardPath.Conversation
        }
    ]

    return (
        <main className="w-full h-full flex flex-col items-center justify-center bg-transparent pb-5">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center gap-6 px-4 sm:px-6 md:px-8 text-center">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-6 mt-4">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                        Welcome to <span className="text-blue-500">Fornix Labs</span>
                    </h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-sm">
                        Transforming healthcare with smarter tools and solutions.
                    </p>
                </div>

                {/* Feature Highlights Section */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 "lg:grid-cols-4" gap-4 w-full`}>
                    {features.map((feature, index) => (
                        <Link
                            href={`/dashboard${feature.tab}`}
                            key={index}
                            onClick={() => setActiveTab(feature.tab)}
                            className="flex flex-col items-center bg-blue-50 p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-100 cursor-pointer transition-all">
                            <div className="mb-3">{feature.icon}</div>
                            <h2 className="text-sm sm:text-base font-semibold text-blue-600 mb-1">{feature.title}</h2>
                            <p className="text-gray-700 text-xs sm:text-sm text-center">{feature.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}

export default DoctorLandingPage

import React, { Dispatch, SetStateAction, useEffect } from "react"
import Image from "next/image"
import { FaHouse, FaStethoscope } from "react-icons/fa6"
import { PiUser } from "react-icons/pi"
import { HiOutlineSparkles } from "react-icons/hi2"
import { RiVoiceprintFill } from "react-icons/ri"

import Logo from "../../../public/images/logo-primary.png"
import { MdOutlineHelp } from "react-icons/md"
import { DashboardPath } from "@/utils/types"
import { CiImport } from "react-icons/ci"
// Add these imports for the new icons
import { TbTestPipe } from "react-icons/tb"
import { MdOutlineRadio } from "react-icons/md"

import { motion } from "framer-motion"
import Link from "next/link"
import useAuthStore from "../../../store/AuthStore"
import { useTabStore } from "../../../store/TabStore"

interface ITabController {
    setShowConnections?: Dispatch<SetStateAction<boolean>>
    showTab: boolean
}

export const ContextControls = ({ setShowConnections }: { setShowConnections?: Dispatch<SetStateAction<boolean>> }) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    return (
        <div className="flex items-center justify-between md:justify-start gap-3">
            {auth.role !== "RADIOLOGIST" && (
                <button
                    title="Connections"
                    className="md:flex gap-[5px] font-bold px-3 hover:shadow-md bg-[#F1F5F9] rounded-[10px] py-2 text-[#111111] items-center"
                    onClick={() => setShowConnections && setShowConnections(true)}>
                    <span className="flex items-center justify-center">
                        <PiUser />
                    </span>
                    {auth.role !== "DOCTOR" && <p>Connections</p>}
                </button>
            )}
            <div className="flex gap-[5px] font-bold px-3 rounded-[10px] py-2 text-black items-center">
                <span className="w-6 h-6 flex items-center justify-center">
                    <MdOutlineHelp className="text-[#d9d9d9] text-2xl" />
                </span>
                <Link href={`/dashboard${DashboardPath.HowItWorks}`}>How it works</Link>
            </div>
        </div>
    )
}

export const TabController = ({ setShowConnections, showTab }: ITabController) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()

    // showTab here is used to prevent seeing this on the SettingsIndex
    const tabIconSize = 20
    let doctorTabs = [
        {
            heading: "Patient Diagnosis",
            slug: DashboardPath.Diagnosis,
            icon: <FaStethoscope size={tabIconSize} />
        },
        {
            heading: "Import Patient Summary",
            slug: DashboardPath.ImportSummary,
            icon: <CiImport size={tabIconSize} />
        },
        {
            heading: "MedFind",
            slug: DashboardPath.MedFind,
            icon: <HiOutlineSparkles size={tabIconSize} />
        },
        {
            heading: "Ambient Conversation Capture",
            slug: DashboardPath.Conversation,
            icon: <RiVoiceprintFill size={tabIconSize} />
        }
    ]

    doctorTabs = auth.role === "PHARMACY" ? doctorTabs.slice(0, -1) : doctorTabs

    let patientTabs = [
        {
            heading: "Pre-Consultation Interaction",
            slug: DashboardPath.Condition,
            icon: <FaStethoscope size={tabIconSize} />
        },
        {
            heading: "MedFind",
            slug: DashboardPath.PatientMedFind,
            icon: <HiOutlineSparkles size={tabIconSize} />
        }
    ]

    // Add radiologist tabs
    let radiologistTabs = [
        {
            heading: "Radiology",
            slug: DashboardPath.Radiology,
            icon: <MdOutlineRadio size={tabIconSize} />
        },
        {
            heading: "Lab Test",
            slug: DashboardPath.LabTest,
            icon: <TbTestPipe size={tabIconSize} />
        }
    ]

    const currentTabs =
        auth.role === "PATIENT"
            ? patientTabs
            : auth.role === "PHARMACY"
              ? doctorTabs.slice(0, -1)
              : auth.role === "RADIOLOGIST"
                ? radiologistTabs
                : doctorTabs

    return (
        <header className={`hidden ${showTab && "lg:flex"} items-center justify-between w-full text-xs 2xl:text-sm`}>
            {auth.role === "PATIENT" && (
                <div>
                    <div className="flex place-items-center gap-2">
                        {/* home button */}
                        <Link
                            href={`/dashboard${DashboardPath.Base}`}
                            className="bg-slate-50 px-4 py-2 rounded-full cursor-pointer"
                            onClick={() => setActiveTab(DashboardPath.Base)}>
                            <FaHouse />
                        </Link>
                    </div>
                </div>
            )}

            {(auth.role === "DOCTOR" ||
                auth.role === "PHARMACY" ||
                auth.role === "PATIENT" ||
                auth.role === "RADIOLOGIST") && (
                <div className="flex h-12 2xl:h-16 px-2 bg-gray-50 rounded-full border border-gray-300 items-center justify-between">
                    <div className="flex gap-2 2xl:gap-6 items-center select-none">
                        {currentTabs.map((tab, index) => (
                            <div key={index} className="relative">
                                {activeTab === tab.slug && (
                                    <motion.div
                                        layoutId="tab-background"
                                        className="absolute inset-0 border border-blue-300 bg-white rounded-full shadow-md"
                                        transition={{ type: "spring", duration: 0.4 }}
                                    />
                                )}
                                <Link
                                    href={`/dashboard${tab.slug}`}
                                    onClick={() => {
                                        console.log("Tab clicked:", tab.heading)
                                        console.log("Setting tab to:", tab.slug)
                                        setActiveTab(tab.slug)
                                    }}
                                    className={`flex justify-between items-center gap-2 rounded-full px-4 py-1 2xl:py-3 cursor-pointer relative z-10 ${
                                        activeTab === tab.slug ? "text-gray-800 font-semibold" : "text-gray-400"
                                    }`}>
                                    {tab.icon}
                                    {tab.heading}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ContextControls setShowConnections={setShowConnections} />
        </header>
    )
}

"use client"
import { LogoAsset } from "@/components/assets/LogoAsset"
import {
    DashboardPath,
    DoctorDashboardDiagnosis,
    LogoVariants,
    MedFindHistoryItem,
    PatientMedFindHistoryItem,
    QuestionnaireHistoryType,
    UserConnection,
    UserConnectionsUser
} from "@/utils/types"
import { FaCirclePlus } from "react-icons/fa6"
import React, { Dispatch, SetStateAction, useState, useMemo, useEffect } from "react"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { IoSettingsOutline } from "react-icons/io5"
import RemainingCredits from "@/components/dashboard/RemainingCredits"
import { useQuestionnaireHistoryStore } from "../../../store/questionaireHistoryStore"
import Link from "next/link"
import useAuthStore from "../../../store/AuthStore"
import { useTabStore } from "../../../store/TabStore"
import { parseRole } from "@/utils/dashboard/role"
import { getCurrentOrganizationClient } from "@/services/admin/organization.service"

import useConversationPageRouteStore from "../../../store/ConversationPageRouteStore"
import useMedFindHistoryStore from "../../../store/MedFindHistoryStore"
import ReportList, { PatientFilter } from "./ReportList"
import { getDashboardPathReportType } from "@/utils/dashboard/helpers"
import DocPatientPrevConversationsList from "./conversation/DocPatientPrevConversationsList"
import { TAB_CONFIG } from "./navbar/tabConfig"
import { NavbarHeader } from "./navbar/NavbarHeader"
import { NavbarSearch } from "./navbar/NavbarSearch"
import { MedFindHistoryList } from "./navbar/lists/MedFindHistoryList"
import { ImportSummaryList } from "./navbar/lists/ImportSummaryList"
import { DiagnosisHistoryList } from "./navbar/lists/DiagnosisHistoryList"
import { useNavbarConfig } from "./navbar/useNavbarConfig"

import { RadiologyNavbarSection } from "./navbar/radiology/RadiologyNavbarSection"
import LabTestNavbarSection from "./navbar/lab-test/LabTestNavbarSection"
import CombinedReportsNavbarSection from "./navbar/combined_radiology/CombinedReports"

export const formatMedFindDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
}

interface NavbarProps {
    sx?: string
    handleShowSettings: () => void
    goHome: () => void
    patientHistoryList: DoctorDashboardDiagnosis[] | null
    openModal: (patient: DoctorDashboardDiagnosis) => void
    setShowPurchaseOverlay: Dispatch<SetStateAction<boolean>>
    goToQuestionaire: () => void
    medFindHistoryList?: MedFindHistoryItem[] | null
    patientMedFindHistoryList?: PatientMedFindHistoryItem[] | null
    QuestionnaireHistoryList: QuestionnaireHistoryType[] | null
    connections: UserConnection[] | null
    physicalExaminationHistory?: any[]
    conversationHistory?: any[]
}

export const Navbar: React.FC<NavbarProps> = ({
    sx = "",
    handleShowSettings,
    goHome,
    patientHistoryList,
    openModal,
    setShowPurchaseOverlay,
    goToQuestionaire,
    medFindHistoryList,
    patientMedFindHistoryList,
    QuestionnaireHistoryList,
    conversationHistory,
    physicalExaminationHistory,
    connections
}) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()
    const { medFindHistoryList: medFindHistory } = useMedFindHistoryStore()
    const router = useRouter()
    const pathName = usePathname()
    const { questionnaireId, setQuestionnaireId, fetchQuestionnaireHistory } = useQuestionnaireHistoryStore()
    const { setStep } = useConversationPageRouteStore()

    // Centralised tab configuration (may be undefined for some paths yet)
    const tabCfg = TAB_CONFIG[activeTab as DashboardPath]

    const { label, placeholder, onAddNew } = useNavbarConfig(activeTab as DashboardPath)

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPatients, setSelectedPatients] = useState<UserConnectionsUser[]>([])
    const [orgName, setOrgName] = useState<string>("")
    const [showTooltip, setShowTooltip] = useState(false)
    useEffect(() => {
        console.log("[Navbar] auth state:", auth)
    }, [auth])

    useEffect(() => {
        const fetchOrgName = async () => {
            if (auth.organization_id) {
                console.log("[Navbar] fetching current org via /api/organization")
                const result = await getCurrentOrganizationClient()
                console.log("[Navbar] org fetch result:", result)
                if (result.success && result.data?.name) {
                    setOrgName(result.data.name)
                } else {
                    setOrgName("")
                }
            } else {
                console.log("[Navbar] no organization_id on auth; skipping fetch")
                setOrgName("")
            }
        }
        fetchOrgName()
    }, [auth.organization_id])

    // Combine search data from all categories.
    const combinedSearchData = useMemo(() => {
        const diagnoses = (patientHistoryList || []).map(item => ({
            ...item,
            category: "Diagnoses"
        }))
        const medFinds = (medFindHistoryList || []).map(item => ({
            ...item,
            category: "MedFind"
        }))
        const patientMedFinds = (patientMedFindHistoryList || []).map(item => ({
            ...item,
            category: "Patient MedFind"
        }))
        const questionnaires = (QuestionnaireHistoryList || []).map(item => ({
            ...item,
            category: "Questionnaires"
        }))
        const conversations = (conversationHistory || []).map(item => ({
            ...item,
            category: "Conversations"
        }))
        return [...diagnoses, ...medFinds, ...patientMedFinds, ...questionnaires, ...conversations]
    }, [
        patientHistoryList,
        medFindHistoryList,
        patientMedFindHistoryList,
        QuestionnaireHistoryList,
        conversationHistory
    ])

    const activeCategory = useMemo(() => {
        if (auth.role === "PATIENT") {
            return activeTab === DashboardPath.PatientMedFind ? "Patient MedFind" : "Questionnaires"
        } else {
            if (activeTab === DashboardPath.MedFind) return "MedFind"
            if (activeTab === DashboardPath.Conversation) return "Conversations"
            if (activeTab === DashboardPath.ImportSummary) return "Import Summary"
            return "Diagnoses"
        }
    }, [auth.role, activeTab])

    const filteredResults = useMemo(() => {
        if (!searchQuery) return []
        const lowerQuery = searchQuery.toLowerCase()
        return combinedSearchData.filter(
            item => item.category === activeCategory && item.name && item.name.toLowerCase().includes(lowerQuery)
        )
    }, [searchQuery, combinedSearchData, activeCategory])

    // Always display search input for Conversations, regardless of search data.
    const shouldDisplaySearch =
        activeCategory === "Conversations" ||
        combinedSearchData.filter(item => item.category === activeCategory).length > 0

    const filteredDiagnosisList = useMemo(() => {
        if (!patientHistoryList) return []

        // If no patients are selected, show all diagnoses
        if (selectedPatients.length === 0) {
            return patientHistoryList
        }

        // Filter diagnoses based on selected patients
        const selectedPatientIds = selectedPatients.map(p => p.id).filter(Boolean)
        return patientHistoryList.filter(
            diagnosis => diagnosis.patient_id && selectedPatientIds.includes(diagnosis.patient_id)
        )
    }, [patientHistoryList, selectedPatients])

    // Determine if PatientFilter should be shown
    const showPatientFilter = useMemo(() => {
        if (tabCfg && typeof tabCfg.showPatientFilter === "boolean") return tabCfg.showPatientFilter
        return (
            activeTab === DashboardPath.Conversation ||
            activeTab === DashboardPath.HistoryTaking ||
            activeTab === DashboardPath.Examination ||
            activeTab === DashboardPath.ProgressNotes ||
            activeTab === DashboardPath.OperativeNotes ||
            activeTab === DashboardPath.AdmissionNotes ||
            activeTab === DashboardPath.DischargeSummary ||
            activeTab === DashboardPath.ProcedureNote ||
            activeTab === DashboardPath.ReferralNotes ||
            activeTab === DashboardPath.Diagnosis
        )
    }, [tabCfg, activeTab])

    const ACC_REPORT_PATHS = [
        DashboardPath.HistoryTaking,
        DashboardPath.Examination,
        DashboardPath.ProgressNotes,
        DashboardPath.OperativeNotes,
        DashboardPath.AdmissionNotes,
        DashboardPath.DischargeSummary,
        DashboardPath.ProcedureNote,
        DashboardPath.ReferralNotes
    ]

    return (
        <div
            className={`${sx} hidden w-64 2xl:w-96 pt-4 px-3 2xl:px-6 lg:flex flex-col items-center h-full 
                bg-gray-50 rounded-xl`}>
            <div className="flex flex-col w-full h-full justify-between items-center">
                {/* Clicking on logo sends user to the start page */}
                <Link href={"/dashboard"} className="w-full flex flex-shrink-0 items-center ml-0">
                    <LogoAsset size={100} title={true} variant={LogoVariants.primary} />
                </Link>

                {["DOCTOR", "PHARMACY"].includes(auth.role) && (
                    <div className="flex flex-1 overflow-y-auto flex-col w-full pb-6">
                        <NavbarHeader label={label} onAddNew={onAddNew} />

                        {shouldDisplaySearch && (
                            <div className="w-full mt-2">
                                <div className="flex items-center gap-2">
                                    <NavbarSearch
                                        placeholder={placeholder}
                                        searchData={combinedSearchData}
                                        activeCategory={activeCategory}
                                        onResultClick={item => {
                                            if (item.category === "Diagnoses") {
                                                openModal(item)
                                            } else if (item.category === "MedFind") {
                                                localStorage.setItem("mfi", item.session_id)
                                                window.dispatchEvent(new Event("storage"))
                                            } else if (item.category === "Patient MedFind") {
                                                localStorage.setItem("pmfi", item.session_id)
                                                window.dispatchEvent(new Event("storage"))
                                            } else if (item.category === "Questionnaires") {
                                                setActiveTab(DashboardPath.Base)
                                            } else if (item.category === "History Taking") {
                                                useConversationPageRouteStore.getState().setStep(0)
                                            } else if (item.category === "Physical Examination") {
                                                useConversationPageRouteStore.getState().setStep(0)
                                            }
                                        }}
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                    />

                                    {showPatientFilter && (
                                        <div className="flex-shrink-0">
                                            <PatientFilter
                                                selectedPatients={selectedPatients}
                                                onPatientSelect={setSelectedPatients}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Render list content based on the active tab – simplified grouping */}
                        {(() => {
                            // MedFind list
                            if (activeTab === DashboardPath.MedFind) {
                                return medFindHistory ? <MedFindHistoryList history={medFindHistory} /> : null
                            }

                            // Import Summary list
                            if (activeTab === DashboardPath.ImportSummary) {
                                return connections ? (
                                    <ImportSummaryList
                                        connections={connections}
                                        onItemClick={connection => {
                                            localStorage.setItem("aip_id", connection.patient.id)
                                            const temp = { connection: connection }
                                            localStorage.setItem("aip_t", JSON.stringify(temp))
                                            window.dispatchEvent(new Event("storage"))
                                            setActiveTab(DashboardPath.ImportSummary)
                                        }}
                                    />
                                ) : null
                            }

                            // Diagnosis / Base tabs – patient history list
                            if (activeTab === DashboardPath.Diagnosis || activeTab === DashboardPath.Base) {
                                return patientHistoryList ? (
                                    <DiagnosisHistoryList
                                        diagnoses={filteredDiagnosisList}
                                        onItemClick={(patient: DoctorDashboardDiagnosis) => openModal(patient)}
                                        hasSelectedPatients={selectedPatients.length > 0}
                                    />
                                ) : null
                            }

                            // All report-related tabs share the same component
                            return <ReportList selectedPatients={selectedPatients} />
                        })()}
                    </div>
                )}

                {auth.role === "RADIOLOGIST" && (
                    <>
                        {pathName === "/dashboard" && (
                            <CombinedReportsNavbarSection
                                onReportClick={() => {
                                    console.log("report clicked")
                                }}
                            />
                        )}
                        {pathName === "/dashboard/radiology" && (
                            <RadiologyNavbarSection
                                onReportClick={() => {
                                    console.log("report clicked")
                                }}
                            />
                        )}
                        {pathName === "/dashboard/lab-test" && (
                            <LabTestNavbarSection
                                onReportClick={() => {
                                    console.log("lab test clicked")
                                }}
                            />
                        )}
                    </>
                )}

                {auth.role === "PATIENT" && (
                    <div className="flex flex-1 overflow-y-auto flex-col w-full pb-6">
                        {activeTab === DashboardPath.PatientMedFind ? (
                            <>
                                <div className="w-full mt-4 2xl:mt-12 flex justify-between items-center">
                                    <span className="uppercase text-sm 2xl:text-lg text-gray-500">Search History</span>
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => {
                                            localStorage.setItem("pmfi", "")
                                            localStorage.removeItem("pmfi")
                                            window.dispatchEvent(new Event("storage"))
                                        }}>
                                        <FaCirclePlus size={25} />
                                    </div>
                                </div>
                                {shouldDisplaySearch && (
                                    <div className="w-full px-2 mt-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search by name..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            {searchQuery && (
                                                <div className="absolute top-full left-0 right-0 bg-white shadow-md z-10 max-h-60 overflow-y-auto mt-1 rounded-md">
                                                    {filteredResults.length > 0 ? (
                                                        filteredResults.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                role="button"
                                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                                                                onClick={() => {
                                                                    if (item.category === "Patient MedFind") {
                                                                        localStorage.setItem("pmfi", item.session_id)
                                                                        window.dispatchEvent(new Event("storage"))
                                                                    }
                                                                    setSearchQuery("")
                                                                }}>
                                                                <p className="text-sm font-medium text-gray-700">
                                                                    {item.name}
                                                                </p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                            No results found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {patientMedFindHistoryList && (
                                    <div className="mt-4 text-xs overflow-y-auto">
                                        {patientMedFindHistoryList.map((pmfh, index) => (
                                            <div
                                                key={index}
                                                role="button"
                                                onClick={() => {
                                                    localStorage.setItem("pmfi", pmfh.session_id)
                                                    window.dispatchEvent(new Event("storage"))
                                                }}
                                                className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none">
                                                {pmfh.name}
                                                <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full">
                                                    <CgArrowsExpandUpRight size={23} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mt-4 text-xs overflow-y-auto">
                                {QuestionnaireHistoryList &&
                                    QuestionnaireHistoryList.map((q, index) => (
                                        <div
                                            key={index}
                                            role={"button"}
                                            className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg
                                                    hover:font-semibold hover:bg-gray-100 select-none"
                                            onClick={e => {
                                                e.stopPropagation()
                                                goToQuestionaire()
                                                setQuestionnaireId(q.thread_id)
                                            }}>
                                            {`Conversation from ${new Date(q.created_at).toLocaleString()}`}
                                            <div
                                                className="flex text-gray-400 justify-center items-center
                                                        hover:text-black p-2 rounded-full">
                                                <CgArrowsExpandUpRight size={23} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-shrink-0 flex-col gap-6 w-full">
                    <RemainingCredits credits={auth.credits} setShowCreditPurchaseOverlay={setShowPurchaseOverlay} />

                    <div className="w-full mb-4 flex justify-between items-center">
                        <div className="flex gap-1 items-center">
                            {auth.profile_picture_url ? (
                                <Image
                                    src={auth.profile_picture_url}
                                    alt="profile img"
                                    width={50}
                                    height={50}
                                    className="w-10 h-10 rounded-full 2xl:w-14 2xl:h-14"
                                />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-full bg-blue-500 text-white text-xl flex items-center
                                    justify-center">
                                    {auth.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="w-24 px-2 2xl:w-32 flex flex-col justify-between">
                                <p className="text-sm w-full overflow-hidden whitespace-nowrap text-ellipsis text-center">
                                    {auth.name}
                                </p>
                                <div
                                    className="w-full flex justify-center items-center rounded-full bg-orange-100 p-1 cursor-default select-none relative"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}>
                                    <p className="flex items-center text-xs text-orange-800 text-center truncate">
                                        {parseRole(auth.role)}
                                    </p>
                                    {showTooltip && (
                                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                                            {parseRole(auth.role)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            className="flex justify-center items-center text-gray-400 hover:text-black hover:bg-gray-200
                                p-2 rounded-full"
                            onClick={handleShowSettings}>
                            <IoSettingsOutline size={25} />
                        </button>
                    </div>
                </div>

                {/* Organization name at bottom */}
                {orgName && (
                    <div className="w-full px-3 2xl:px-6 pb-4">
                        <div className="w-full flex justify-center items-center rounded-full bg-gray-100 p-2">
                            <p className="text-xs text-gray-600 text-center truncate">{orgName}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

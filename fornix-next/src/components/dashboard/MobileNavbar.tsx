import React, { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react"
import { LogoAsset } from "@/components/assets/LogoAsset"
import {
    authDefault,
    DashboardPath,
    DoctorDashboardDiagnosis,
    LogoVariants,
    MedFindHistoryItem,
    QuestionnaireHistoryType,
    PatientMedFindHistoryItem,
    UserConnection,
    UserConnectionsUser
} from "@/utils/types"
import { CgArrowsExpandUpRight, CgClose, CgMenuRightAlt } from "react-icons/cg"
import { FaCaretDown, FaCirclePlus, FaHouse, FaStethoscope } from "react-icons/fa6"
import { AnimatePresence, motion } from "framer-motion"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { usePathname, useRouter } from "next/navigation"
import { HiOutlineSparkles } from "react-icons/hi2"
import { IoSettingsOutline } from "react-icons/io5"
import { IoIosArrowBack } from "react-icons/io"
import RemainingCredits from "@/components/dashboard/RemainingCredits"
import Image from "next/image"
import { RiVoiceprintFill } from "react-icons/ri"
import { getPatientQuestionnaireHistory } from "@/services/dashboard/patient_history.service"
import { useQuestionnaireHistoryStore } from "../../../store/questionaireHistoryStore"
import Link from "next/link"
import useAuthStore from "../../../store/AuthStore"
import { useTabStore } from "../../../store/TabStore"
import useCloseModalOnOutsideClicked from "@/utils/hooks/useCloseModalOnOutsideClicked"
import useCloseOnEsc from "@/utils/hooks/useCloseOnEsc"
import { parseRole } from "@/utils/dashboard/role"
import { getCurrentOrganizationClient } from "@/services/admin/organization.service"

import { ContextControls } from "@/components/dashboard/TabController"
import { CiImport } from "react-icons/ci"
// Add these imports for the new icons
import { TbTestPipe } from "react-icons/tb"
import { MdOutlineRadio } from "react-icons/md"
import useConversationPageRouteStore from "../../../store/ConversationPageRouteStore"
import ReportList, { PatientFilter } from "./ReportList"
import { getDashboardPathReportType } from "@/utils/dashboard/helpers"
import DocPatientPrevConversationsList from "./conversation/DocPatientPrevConversationsList"
import { useNavbarConfig } from "./navbar/useNavbarConfig"
import { NavbarHeader } from "./navbar/NavbarHeader"
import { NavbarSearch } from "./navbar/NavbarSearch"
import { MedFindHistoryList } from "./navbar/lists/MedFindHistoryList"
import { ImportSummaryList } from "./navbar/lists/ImportSummaryList"
import { DiagnosisHistoryList } from "./navbar/lists/DiagnosisHistoryList"
import { PatientMedFindHistoryList } from "./navbar/lists/PatientMedFindHistoryList"
import { QuestionnaireHistoryList } from "./navbar/lists/QuestionnaireHistoryList"
import { useMobileNavbarData } from "./navbar/useMobileNavbarData"
import { MobileRadiologyNavbarSection } from "./navbar/radiology/MobileRadiologyNavbarSection"
import MobileLabTestNavbarSection from "./navbar/lab-test/MobileLabTestNavbarSection"

export const formatPatientMedFindDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
}

export const MobileNavbar = ({
    handleShowSettings,
    setShowConnections,
    showFornix = true,
    patientHistoryList,
    openModal,
    setShowPurchaseOverlay,
    medFindHistoryList,
    patientMedFindHistoryList,
    connections
}: {
    handleShowSettings: () => void
    setShowConnections: Dispatch<SetStateAction<boolean>>
    showFornix?: boolean
    patientHistoryList: DoctorDashboardDiagnosis[] | null
    openModal: (patient: DoctorDashboardDiagnosis) => void
    setShowPurchaseOverlay: Dispatch<SetStateAction<boolean>>
    medFindHistoryList?: MedFindHistoryItem[] | null
    patientMedFindHistoryList?: PatientMedFindHistoryItem[] | null
    connections: UserConnection[] | null
}) => {
    const { auth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()
    const { setStep } = useConversationPageRouteStore()

    const { label, placeholder, onAddNew } = useNavbarConfig(activeTab as DashboardPath)

    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showTabMenu, setShowTabMenu] = useState(false)
    // State for storing questionnaire history (for patients)
    const [questionnaireHistoryList, setQuestionnaireHistoryList] = useState<QuestionnaireHistoryType[] | null>(null)
    const setQuestionnaireId = useQuestionnaireHistoryStore(state => state.setQuestionnaireId)

    // State for search in mobile menu
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPatients, setSelectedPatients] = useState<UserConnectionsUser[]>([])
    const [orgName, setOrgName] = useState<string>("")

    const { availableSearchData, filteredDiagnosisList } = useMobileNavbarData({
        activeTab: activeTab as DashboardPath,
        patientHistoryList,
        medFindHistoryList,
        patientMedFindHistoryList,
        questionnaireHistoryList,
        selectedPatients
    })

    const mobileNavRef = useRef<HTMLDivElement>(null)
    useCloseModalOnOutsideClicked(mobileNavRef, () => setShowTabMenu(false))
    useCloseOnEsc(() => setShowTabMenu(false))

    useEffect(() => {
        setShowTabMenu(false)
        setShowMobileMenu(false)
    }, [activeTab])

    useEffect(() => {
        const fetchOrgName = async () => {
            console.log("[MobileNavbar] auth state:", auth)
            if (auth.organization_id) {
                console.log("[MobileNavbar] fetching current org via /api/organization")
                const result = await getCurrentOrganizationClient()
                console.log("[MobileNavbar] org fetch result:", result)
                if (result.success && result.data?.name) {
                    setOrgName(result.data.name)
                } else {
                    setOrgName("")
                }
            } else {
                console.log("[MobileNavbar] no organization_id on auth; skipping fetch")
                setOrgName("")
            }
        }
        fetchOrgName()
    }, [auth.organization_id, auth])

    const tabIconSize = 12
    const doctorTabs = [
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

    const patientTabs = [
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

    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const getQuestionnaireHistory = async () => {
            try {
                const res = await getPatientQuestionnaireHistory()
                if (res) {
                    setQuestionnaireHistoryList(res)
                }
            } catch (error) {
                console.error("Error fetching questionnaire history:", error)
            }
        }
        getQuestionnaireHistory()
    }, [])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleMenuToggle = (menuToToggle: "tabMenu" | "mobileMenu") => {
        if (menuToToggle === "tabMenu") {
            setShowTabMenu(prevShowTabMenu => {
                const isOpeningTabMenu = !prevShowTabMenu
                if (isOpeningTabMenu) {
                    setShowMobileMenu(false)
                }
                return isOpeningTabMenu
            })
        } else if (menuToToggle === "mobileMenu") {
            setShowMobileMenu(prevShowMobileMenu => {
                const isOpeningMobileMenu = !prevShowMobileMenu
                if (isOpeningMobileMenu) {
                    setShowTabMenu(false)
                }
                return isOpeningMobileMenu
            })
        }
    }

    return (
        <div
            ref={mobileNavRef}
            className="z-30 relative px-3 lg:hidden flex justify-between items-center w-full h-14 bg-white rounded-lg shadow-md">
            {activeTab === DashboardPath.Settings ? (
                <button
                    onClick={() => {
                        router.back()
                    }}
                    className="text-gray-700 flex items-center gap-1">
                    <IoIosArrowBack size={20} />
                    <p>Back</p>
                </button>
            ) : (
                <Link
                    href={`/dashboard${DashboardPath.Base}`}
                    className=""
                    onClick={() => setActiveTab(DashboardPath.Base)}>
                    <LogoAsset size={30} title={false} variant={LogoVariants.primary} />
                </Link>
            )}

            {/*{auth.role === "PATIENT" && (
                <div className="flex place-items-center">
                    <Link
                        href={`/dashboard${DashboardPath.Base}`}
                        className="bg-slate-50 px-4 py-2 rounded-full cursor-pointer flex items-center gap-2"
                        onClick={() => setActiveTab(DashboardPath.Base)}>
                        <FaHouse />
                        <span className="text-gray-700 text-sm font-medium">Home</span>
                    </Link>
                </div>
            )}*/}

            {(auth.role === "DOCTOR" ||
                auth.role === "PHARMACY" ||
                auth.role === "PATIENT" ||
                auth.role === "RADIOLOGIST") &&
                showFornix && (
                    <div
                        className={`relative w-1/2 max-w-72 py-1 text-sm font-semibold rounded-full flex gap-2 justify-evenly items-center 
                        border border-blue-300 shadow ${showTabMenu && " tab-menu-glow"}`}
                        onClick={() => {
                            handleMenuToggle("tabMenu")
                        }}>
                        <span className="text-blue-400 pl-1">
                            {currentTabs.find(tab => tab.slug === activeTab)?.icon}
                        </span>
                        <span className="overflow-hidden text-nowrap text-ellipsis">
                            {currentTabs.find(tab => tab.slug === activeTab)?.heading ?? "Home"}
                        </span>
                        <span className="text-gray-700 flex justify-center items-center pr-1">
                            <FaCaretDown size={14} />
                        </span>

                        <AnimatePresence>
                            {showTabMenu && (
                                <motion.div
                                    key="drop-mobile-menu"
                                    initial={{ opacity: 0, y: "-10%" }}
                                    animate={{ opacity: 1, y: "0%" }}
                                    exit={{ opacity: 0, y: "-5%" }}
                                    transition={{ duration: 0.1 }}
                                    className="z-50 absolute bg-white w-full top-9 left-0 right-0 flex flex-col rounded-lg shadow-lg">
                                    {currentTabs.map((tab, index) => (
                                        <Link
                                            href={`/dashboard${tab.slug}`}
                                            key={index}
                                            className={`text-sm flex items-center gap-2 py-2 pl-3 
                                            ${activeTab === tab.slug ? " text-gray-800 " : " text-gray-400"}`}
                                            onClick={() => setActiveTab(tab.slug)}>
                                            <span>{tab.icon}</span>
                                            <span>{tab.heading}</span>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

            <div
                className="text-gray-500 z-20"
                onClick={() => {
                    handleMenuToggle("mobileMenu")
                }}>
                <AnimatePresence mode="wait">
                    {showMobileMenu ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: -90 }}
                            transition={{ duration: 0.1 }}>
                            <CgClose size={30} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, rotate: 90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.1 }}>
                            <CgMenuRightAlt size={30} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                {showMobileMenu && (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0, y: "-10%" }}
                        animate={{ opacity: 1, y: "0%" }}
                        exit={{ opacity: 0, y: "-5%" }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-0 right-0 top-16 bottom-4 w-full h-[calc(100vh-6rem)] bg-white rounded-lg shadow-xl">
                        <div className="flex flex-col w-full h-full px-4 justify-between items-center">
                            {/* History Section */}
                            <div className="flex flex-col w-full flex-1 min-h-0  border-b border-b-gray-400">
                                {auth.role !== "RADIOLOGIST" && (
                                    <NavbarHeader
                                        label={label}
                                        onAddNew={() => {
                                            onAddNew()
                                            setShowMobileMenu(false)
                                        }}
                                    />
                                )}

                                {availableSearchData.length > 0 && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <NavbarSearch
                                                placeholder={placeholder}
                                                searchData={availableSearchData}
                                                activeCategory={activeTab}
                                                onResultClick={item => {
                                                    if (auth.role === "PATIENT") {
                                                        if (activeTab === DashboardPath.PatientMedFind) {
                                                            localStorage.setItem("pmfi", item.session_id)
                                                        } else {
                                                            setQuestionnaireId(item.thread_id)
                                                        }
                                                    } else {
                                                        if (activeTab === DashboardPath.MedFind) {
                                                            localStorage.setItem("mfi", item.session_id)
                                                        } else {
                                                            openModal(item)
                                                        }
                                                    }
                                                    window.dispatchEvent(new Event("storage"))
                                                    setShowMobileMenu(false)
                                                }}
                                                searchQuery={searchQuery}
                                                onSearchChange={setSearchQuery}
                                            />

                                            {/* Patient Filter - Add DashboardPath.Diagnosis to the condition */}
                                            {(activeTab === DashboardPath.Conversation ||
                                                activeTab === DashboardPath.HistoryTaking ||
                                                activeTab === DashboardPath.Examination ||
                                                activeTab === DashboardPath.ProgressNotes ||
                                                activeTab === DashboardPath.OperativeNotes ||
                                                activeTab === DashboardPath.AdmissionNotes ||
                                                activeTab === DashboardPath.DischargeSummary ||
                                                activeTab === DashboardPath.ProcedureNote ||
                                                activeTab === DashboardPath.ReferralNotes ||
                                                activeTab === DashboardPath.Diagnosis) && (
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

                                {auth.role === "RADIOLOGIST" ? (
                                    <>
                                        {activeTab === DashboardPath.Radiology && (
                                            <MobileRadiologyNavbarSection
                                                onReportClick={() => setShowMobileMenu(false)}
                                            />
                                        )}
                                        {activeTab === DashboardPath.LabTest && (
                                            <MobileLabTestNavbarSection
                                                onReportClick={() => setShowMobileMenu(false)}
                                            />
                                        )}
                                    </>
                                ) : ["DOCTOR", "PHARMACY"].includes(auth.role) ? (
                                    <>
                                        {activeTab === DashboardPath.MedFind && medFindHistoryList ? (
                                            <MedFindHistoryList
                                                history={medFindHistoryList}
                                                onItemClick={() => setShowMobileMenu(false)}
                                            />
                                        ) : activeTab === DashboardPath.ImportSummary && connections ? (
                                            <ImportSummaryList
                                                connections={connections}
                                                onItemClick={connection => {
                                                    localStorage.setItem("aip_id", connection.patient.id)
                                                    const temp = { connection: connection }
                                                    localStorage.setItem("aip_t", JSON.stringify(temp))
                                                    window.dispatchEvent(new Event("storage"))
                                                    setActiveTab(DashboardPath.ImportSummary)
                                                    setShowMobileMenu(false)
                                                }}
                                            />
                                        ) : activeTab === DashboardPath.Diagnosis ||
                                          activeTab === DashboardPath.Base ? (
                                            <DiagnosisHistoryList
                                                diagnoses={filteredDiagnosisList}
                                                onItemClick={(patient: DoctorDashboardDiagnosis) => {
                                                    openModal(patient)
                                                    setShowMobileMenu(false)
                                                }}
                                                hasSelectedPatients={selectedPatients.length > 0}
                                            />
                                        ) : (
                                            <ReportList
                                                selectedPatients={selectedPatients}
                                                onItemClick={() => setShowMobileMenu(false)}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {activeTab === DashboardPath.PatientMedFind && patientMedFindHistoryList ? (
                                            <PatientMedFindHistoryList
                                                history={patientMedFindHistoryList}
                                                onItemClick={() => setShowMobileMenu(false)}
                                            />
                                        ) : questionnaireHistoryList ? (
                                            <QuestionnaireHistoryList
                                                history={questionnaireHistoryList}
                                                onItemClick={(item: QuestionnaireHistoryType) => {
                                                    setQuestionnaireId(item.thread_id)
                                                    setShowMobileMenu(false)
                                                }}
                                            />
                                        ) : null}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 w-full pt-4">
                                <ContextControls setShowConnections={setShowConnections} />

                                <RemainingCredits
                                    credits={auth.credits}
                                    setShowCreditPurchaseOverlay={setShowPurchaseOverlay}
                                />

                                <div className="w-full mb-4 flex justify-between items-center">
                                    <div className="flex gap-3 items-center">
                                        {auth.profile_picture_url ? (
                                            <Image
                                                src={auth.profile_picture_url}
                                                alt="profile img"
                                                width={50}
                                                height={50}
                                                className="w-10 h-10 rounded-full 2xl:w-14 2xl:h-14"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white text-xl flex items-center justify-center">
                                                {auth.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="w-24 flex flex-col justify-between">
                                            <p className="text-sm w-full overflow-hidden text-nowrap text-ellipsis text-center">
                                                {auth.name}
                                            </p>
                                            <div className="flex justify-center items-center rounded-full bg-orange-100 p-1 cursor-default select-none">
                                                <p className="flex items-center text-[10px] text-orange-800 text-center truncate cursor-default select-none">
                                                    {parseRole(auth.role)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleShowSettings()}
                                        className="flex justify-center items-center text-gray-400 hover:text-black hover:bg-gray-200 p-2 rounded-full">
                                        <IoSettingsOutline size={25} />
                                    </button>
                                </div>
                            </div>

                            {/* Organization name at bottom */}
                            {orgName && (
                                <div className="w-full px-6 pb-4">
                                    <div className="w-full flex justify-center items-center rounded-full bg-gray-100 p-2">
                                        <p className="text-[10px] text-gray-600 text-center truncate">{orgName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

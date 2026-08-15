"use client"
import React, { useEffect, useRef, useState } from "react"

import { Navbar } from "@/components/dashboard/Navbar"
import { TabController } from "@/components/dashboard/TabController"
import { MobileNavbar } from "@/components/dashboard/MobileNavbar"

import Connections from "@/components/patients/connections/Connections"
import { authDefault, DashboardPath, DoctorDashboardDiagnosis, MedFindHistoryItem, UserConnection } from "@/utils/types"
import useAuthEffect from "@/utils/hooks/useAuthEffect"
import { usePathname, useRouter } from "next/navigation"
import { PatientHistoryModal } from "@/components/dashboard/PatientHistoryModal"
import { CreditPurchaseOverlay } from "@/components/dashboard/CreditPurchaseOverlay"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { getAllConnections } from "@/services/dashboard/connections.service"
import { Watermark } from "@/components/assets/WaterMark"
import { useQuestionnaireHistoryStore } from "../../../../store/questionaireHistoryStore"
import useAuthStore from "../../../../store/AuthStore"
import { useTabStore } from "../../../../store/TabStore"
import useCloseOnEsc from "@/utils/hooks/useCloseOnEsc"
import { GlobalFetchInterceptor } from "@/app/providers"
import useMedFindHistoryStore from "../../../../store/MedFindHistoryStore"
import usePatientHistoryStore from "../../../../store/PatientHistoryStore"
import usePatientMedFindHistoryStore from "../../../../store/PatientMedFindHistoryStore"
import { useReportStore } from "../../../../store/ReportStore"
import { useRadiologyReportStore } from "../../../../store/RadiologyReportStore"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<DoctorDashboardDiagnosis | null>(null)

    const [showConnections, setShowConnections] = useState(false)
    const { auth, setAuth, resetAuth } = useAuthStore()

    // const [patientHistoryList, setPatientHistoryList] = useState<DoctorDashboardDiagnosis[] | null>(null)

    const [showPurchaseOverlay, setShowPurchaseOverlay] = useState(false)
    const [connections, setConnections] = useState<UserConnection[] | null>(null)
    // const [medFindHistoryList, setMedFindHistoryList] = useState<MedFindHistoryItem[] | null>(null)

    // State for responsive scrolling
    const [shouldScroll, setShouldScroll] = useState(true)

    const { medFindHistoryList, setMedFindHistoryList, updateMedFindHistoryList } = useMedFindHistoryStore()
    const { patientmedFindHistoryList, setpatientMedFindHistoryList, updatepatientMedFindHistoryList } =
        usePatientMedFindHistoryStore()
    const { patientHistoryList, setPatientHistoryList, updatePatientHistoryList } = usePatientHistoryStore()

    const {
        questionnaireId,
        setQuestionnaireId,
        fetchQuestionnaireHistory,
        getPatientName,
        getPreviousConversationsList,
        previousConversations
    } = useQuestionnaireHistoryStore()

    const isMounted = useRef(false)

    const { getAllReports } = useReportStore()

    const router = useRouter()
    const pathname = usePathname()

    const { activeTab, setActiveTab } = useTabStore()
    const [showTab, setShowTab] = useState(activeTab !== DashboardPath.Settings)

    const openModal = (patient: DoctorDashboardDiagnosis) => {
        setSelectedPatient(patient)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setSelectedPatient(null)
        setIsModalOpen(false)
    }

    const openDiagnosis = () => {
        if (!selectedPatient) return
        clearAllDiagnosisData()
        window.localStorage.setItem("diag", JSON.stringify(selectedPatient))

        setIsModalOpen(false)
        setActiveTab(DashboardPath.Diagnosis)
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new Event("diagnosisChanged"))
        router.push(`/dashboard${DashboardPath.Diagnosis}`)
    }

    const handleShowSettings = () => {
        if (pathname.includes("settings")) {
            router.back()
        } else {
            router.push("/dashboard/settings")
        }
    }

    const handleCloseConnectionsModal = () => setShowConnections(false)
    useCloseOnEsc(handleCloseConnectionsModal) // Close connections modal on esc

    const updateAuth = useAuthEffect(setAuth)
    // const updatePatientHistory = usePatientHistoryEffect(setPatientHistoryList)
    // const updateMedFindHistory = useMedFindHistoryEffect(setMedFindHistoryList)

    const updateConnections = async () => setConnections(await getAllConnections())

    const { fetchReports } = useRadiologyReportStore()

    const { clearActiveReport } = useReportStore.getState()

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    useEffect(() => {
        // Extract the second part of the pathname
        const segments = pathname.split("/")
        const lastSegment = segments[segments.length - 1]
        const tabPath = `/${lastSegment}`

        if (Object.values(DashboardPath).includes(tabPath as DashboardPath)) {
            setActiveTab(tabPath as DashboardPath)
        }
    }, [pathname, setActiveTab])

    useEffect(() => {
        if (questionnaireId !== "0" && questionnaireId !== null) {
            setActiveTab(DashboardPath.Condition)
            fetchQuestionnaireHistory(questionnaireId)
        }
    }, [questionnaireId])

    useEffect(() => {
        setShowTab(activeTab !== DashboardPath.Settings)
    }, [activeTab])

    useEffect(() => {
        // Extract the tab path from URL, removing /dashboard prefix
        const tabPath = pathname.replace("/dashboard", "") || DashboardPath.Base

        clearActiveReport()

        // Only update if it's a valid dashboard path
        if (Object.values(DashboardPath).includes(tabPath as DashboardPath)) {
            setActiveTab(tabPath as DashboardPath)
        }
    }, [pathname, setActiveTab])

    // useEffect(() => {
    //     if ((auth.role && auth.role.toLowerCase() === "user") || (!auth.free_trial && auth.credits === 0)) {
    //         // router.push("/profile-setup")
    //         console.log(auth)
    //     }
    // }, [auth])

    useEffect(() => {
        window.localStorage.removeItem("ipsfp")
        window.localStorage.removeItem("aip_t")
        window.localStorage.removeItem("mfi")
        window.localStorage.removeItem("pmfi")
        window.localStorage.removeItem("acc_t")
        window.localStorage.removeItem("examId")

        setTimeout(() => {
            if (auth === authDefault) {
                updateAuth()
                updatePatientHistoryList()
                updateMedFindHistoryList()
                updatepatientMedFindHistoryList()
                getPreviousConversationsList()
                updateConnections()
            }
        }, 2000)

        const handleStorageChange = () => {
            // setRandomUpdater(new Date())
            updatePatientHistoryList()
            updateMedFindHistoryList()
            updatepatientMedFindHistoryList()
            getPreviousConversationsList()
            updateAuth()
            updateConnections()
        }

        window.addEventListener("storage", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [])

    useEffect(() => {
        if (auth.role === "DOCTOR" || auth.role === "PHARMACY" || auth.role === "PATIENT") updateConnections()
    }, [])

    useEffect(() => {
        if (auth.role !== "ADMIN") {
            getAllReports()
        }
    }, [getAllReports, auth.role])

    // useEffect(() => {
    //     if (auth.credits !== -1 && auth.credits <= 0 && auth.role !== "user") setShowPurchaseOverlay(true)
    // }, [auth])

    return (
        <main className="flex lg:p-3 2xl:p-4 items-center w-full h-screen bg-gray-200 overflow-hidden">
            <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="27%" stopColor="rgba(60, 162, 251, 1)" />
                        <stop offset="95%" stopColor="rgba(3, 84, 155, 1)" />
                    </linearGradient>
                </defs>
            </svg>
            <GlobalFetchInterceptor setShowPurchaseOverlay={setShowPurchaseOverlay} />
            <Navbar
                openModal={openModal}
                setShowPurchaseOverlay={setShowPurchaseOverlay}
                patientHistoryList={patientHistoryList}
                QuestionnaireHistoryList={previousConversations}
                handleShowSettings={handleShowSettings}
                goHome={() => setActiveTab(DashboardPath.Base)}
                goToQuestionaire={() => setActiveTab(DashboardPath.Condition)}
                medFindHistoryList={medFindHistoryList}
                patientMedFindHistoryList={patientmedFindHistoryList}
                connections={connections}
            />

            {isModalOpen && selectedPatient && (
                <PatientHistoryModal
                    patientHistoryItem={selectedPatient}
                    openDiagnosis={openDiagnosis}
                    closeModal={closeModal}
                />
            )}

            {showPurchaseOverlay && <CreditPurchaseOverlay setShowCreditPurchaseOverlay={setShowPurchaseOverlay} />}

            <div className="flex flex-col h-full w-full min-w-0 px-2 pt-2 sm:pt-0 lg:px-4 2xl:px-10">
                {/* showTab should be false for the settings page  */}
                <TabController setShowConnections={setShowConnections} showTab={showTab} />
                <MobileNavbar
                    patientHistoryList={patientHistoryList}
                    openModal={openModal}
                    setShowPurchaseOverlay={setShowPurchaseOverlay}
                    setShowConnections={setShowConnections}
                    handleShowSettings={handleShowSettings}
                    showFornix={showTab}
                    medFindHistoryList={medFindHistoryList}
                    patientMedFindHistoryList={patientmedFindHistoryList}
                    connections={connections}
                />
                <div
                    className={`flex flex-col h-full pt-2 pb-2 lg:pb-0 lg:pt-5 2xl:py-10 ${pathname === "/dashboard/condition" ? "2xl:pb-0" : ""} md:justify-center items-center
                    overflow-y-scroll mobile-diagnosis-form-scrollbar overflow-x-hidden lg:overflow-hidden`}>
                    {children}
                </div>
            </div>

            {showConnections && (
                <Connections
                    connections={connections}
                    setConnections={setConnections}
                    setShowConnections={setShowConnections}
                />
            )}
            <Watermark />
        </main>
    )
}

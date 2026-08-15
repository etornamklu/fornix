"use client"

import { Navbar } from "@/components/dashboard/Navbar"
import Condition from "@/components/patients/condition/Condition"
import { useEffect, useState } from "react"
import PhoneMenu from "@/components/patients/PhoneMenu"
import SettingsIndex from "@/components/patients/settings/SettingsIndex"
import Connections from "@/components/patients/connections/Connections"
import PatientLandingPage from "@/components/patients/Landing"
import LandingHeader from "@/components/patients/LandingHeader"

export default function DoctorDashboard() {
    const [activeTab, setActiveTab] = useState(0)
    const [showPhoneMenu, setSetShowPhoneMenu] = useState(false)
    // Set as true for now
    const [showConnections, setShowConnections] = useState(false)
    // const pages = [
    //     <LandingPage key={0} setActiveTab={setActiveTab} setShowPhoneMenu={setSetShowPhoneMenu}/>,
    //     // <SettingsIndex key={1} role="patient"/>,
    //     <Condition key={2} setShowConnections={setShowConnections}/>,
    // ];

    useEffect(() => {
        setSetShowPhoneMenu(false)
    }, [activeTab])

    return (
        <main
            className={` lg:p-3 2xl:p-4 relative w-full h-screen bg-[#FAFAFA] rounded-[12px] font-product-sans overflow-hidden `}>
            {/*<div className={`w-full flex h-full items-center ${showConnections ? "blur-md" : ""}`}>*/}
            {/*    <Navbar goHome={() => setActiveTab(0)} sx="!bg-gray-100 shadow-md"*/}
            {/*            handleShowSettings={() => setActiveTab((prev) => (prev === 1 ? 0 : 1))} role="patient"/>*/}

            {/*    <div className="flex flex-col h-full w-full px-2 pt-2 sm:pt-0 lg:px-4 2xl:px-10 relative">*/}
            {/*        <div className="px-4">*/}
            {/*            <LandingHeader*/}
            {/*                setShowConnections={setShowConnections}*/}
            {/*                showDeskView={activeTab !== 1}*/}
            {/*                showPhoneMenu={showPhoneMenu}*/}
            {/*                setShowPhoneMenu={setSetShowPhoneMenu}*/}
            {/*                goHome={() => setActiveTab(0)}*/}
            {/*            />*/}
            {/*        </div>*/}
            {/*        {showPhoneMenu && <PhoneMenu showSettings={() => setActiveTab(1)}/>}*/}
            {/*        {pages[activeTab]}*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/*{showConnections && <Connections setShowConnections={setShowConnections} role="patients"/>}*/}
        </main>
    )
}

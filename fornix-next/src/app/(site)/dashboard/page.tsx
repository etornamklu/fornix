"use client"

import useAuthStore from "../../../../store/AuthStore"
import { useTabStore } from "../../../../store/TabStore"
import PatientLandingPage from "@/components/patients/Landing"
import DoctorLandingPage from "@/components/dashboard/DoctorLandingPage"
import RadiologyLandingPage from "@/components/dashboard/RadiologyLanding"
import PharmacyLandingPage from "@/components/dashboard/PharmacyLandingPage"

export default function HomePage() {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()

    return (
        <div className="w-full h-full flex justify-center items-center">
            {auth.role === "PATIENT" && <PatientLandingPage />}
            {auth.role === "DOCTOR" && <DoctorLandingPage />}
            {auth.role === "RADIOLOGIST" && <RadiologyLandingPage />}
            {auth.role === "PHARMACY" && <PharmacyLandingPage />}
        </div>
    )
}

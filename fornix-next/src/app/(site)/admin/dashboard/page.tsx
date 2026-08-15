"use client"

import React, { useState, useEffect } from "react"
import MetricCard from "@/components/admin/MetricCard"
import PatientsOverviewChart from "@/components/admin/PatientsOverviewChart"
import CalendarWidget from "@/components/admin/CalendarWidget"
import PatientsTable from "@/components/admin/PatientsTable"

import { Users, Calendar } from "lucide-react"
import {
    getTotalPatientsCount,
    getLast30DaysPatientsCount,
    getYearlyPatientsCount,
    getDoctorPatients,
    MonthlyPatientCount,
    DoctorPatient
} from "@/services/admin/organization.service"

interface FornixADMDashboardProps {
    activeTab?: string
}

export default function FornixADMDashboard() {
    const [selectedYear, setSelectedYear] = useState("2023")
    const [totalPatients, setTotalPatients] = useState<number>(0)
    const [last30DaysPatients, setLast30DaysPatients] = useState<number>(0)
    const [yearlyData, setYearlyData] = useState<MonthlyPatientCount[]>([])
    const [doctorPatients, setDoctorPatients] = useState<DoctorPatient[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Calculate percentage changes (simplified - you'd need historical data for real comparison)
    const totalPatientsChange = "+23.5%"
    const last30DaysChange = "+4.4%"

    useEffect(() => {
        loadDashboardData()
    }, [])

    useEffect(() => {
        loadYearlyData()
    }, [selectedYear])

    const loadDashboardData = async () => {
        setLoading(true)
        setError(null)

        try {
            // Fetch all dashboard data in parallel
            const [totalResult, last30Result, patientsResult] = await Promise.all([
                getTotalPatientsCount(),
                getLast30DaysPatientsCount(),
                getDoctorPatients(100)
            ])

            if (totalResult.success && totalResult.data !== undefined) {
                setTotalPatients(totalResult.data)
            } else {
                console.error("Error fetching total patients:", totalResult.error)
            }

            if (last30Result.success && last30Result.data !== undefined) {
                setLast30DaysPatients(last30Result.data)
            } else {
                console.error("Error fetching last 30 days patients:", last30Result.error)
            }

            if (patientsResult.success && patientsResult.data) {
                setDoctorPatients(patientsResult.data)
            } else {
                console.error("Error fetching doctor-patient data:", patientsResult.error)
            }

            // Load yearly data for the default year
            await loadYearlyData()
        } catch (err) {
            console.error("Error loading dashboard data:", err)
            setError("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    const loadYearlyData = async () => {
        const yearlyResult = await getYearlyPatientsCount(selectedYear)
        if (yearlyResult.success && yearlyResult.data) {
            setYearlyData(yearlyResult.data)
        } else {
            console.error("Error fetching yearly data:", yearlyResult.error)
        }
    }

    const formatPatientCount = (count: number): string => {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(2)}K`
        }
        return count.toString()
    }

    return (
        <>
            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <MetricCard
                    title="Total patients"
                    value={loading ? "..." : formatPatientCount(totalPatients)}
                    change={totalPatientsChange}
                    trend="up"
                    icon={Users}
                />
                <MetricCard
                    title="Last 30 days patients"
                    value={loading ? "..." : formatPatientCount(last30DaysPatients)}
                    change={last30DaysChange}
                    trend="up"
                    icon={Calendar}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Patients Overview Chart */}
                <PatientsOverviewChart
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    yearlyData={yearlyData}
                    loading={loading}
                />

                {/* Calendar - Optional */}
                {/* <CalendarWidget /> */}
            </div>

            {/* Patients Table */}
            <PatientsTable
                patients={doctorPatients}
                loading={loading}
            />
        </>
    )
}
"use client"

import React from "react"
import { MonthlyPatientCount } from "@/services/admin/organization.service"

interface PatientsOverviewChartProps {
    selectedYear: string
    setSelectedYear: (year: string) => void
    yearlyData: MonthlyPatientCount[]
    loading?: boolean
}

export default function PatientsOverviewChart({
                                                  selectedYear,
                                                  setSelectedYear,
                                                  yearlyData,
                                                  loading = false
                                              }: PatientsOverviewChartProps) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Find max value for scaling
    const maxValue = Math.max(...yearlyData.map(d => d.count), 0)
    const chartHeight = 300

    // Convert data to month-indexed format
    const dataByMonth = months.map((month, index) => {
        const dataPoint = yearlyData.find(d => {
            const monthNum = parseInt(d.month.split("-")[1])
            return monthNum === index + 1
        })
        return {
            month,
            count: dataPoint?.count || 0
        }
    })

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Patients overview</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Medical patients</span>
                    </div>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: chartHeight }}>
                    <div className="text-gray-500">Loading chart data...</div>
                </div>
            ) : (
                <div className="relative" style={{ height: chartHeight }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                        <span>{maxValue}</span>
                        <span>{Math.round(maxValue * 0.75)}</span>
                        <span>{Math.round(maxValue * 0.5)}</span>
                        <span>{Math.round(maxValue * 0.25)}</span>
                        <span>0</span>
                    </div>

                    {/* Chart area */}
                    <div className="ml-12 h-full flex items-end justify-between gap-2">
                        {dataByMonth.map((data, index) => {
                            const heightPercentage = maxValue > 0 ? (data.count / maxValue) * 100 : 0
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full relative group">
                                        <div
                                            className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                                            style={{ height: `${heightPercentage}%`, minHeight: data.count > 0 ? "4px" : "0" }}
                                            title={`${data.month}: ${data.count} patients`}
                                        ></div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {data.count} patients
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-600">{data.month}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
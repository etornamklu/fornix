"use client"

import React, { useState, useEffect } from "react"
import Sidebar from "@/components/admin/Sidebar"
import Header from "@/components/admin/Header"
import useAuthStore from "../../../../store/AuthStore"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { updateAuth } = useAuthStore()

    // Initialize auth data when admin layout loads
    useEffect(() => {
        updateAuth()
    }, [updateAuth])

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-0">
                {/* Fixed Header */}
                <div className="sticky top-0 z-30">
                    <Header setSidebarOpen={setSidebarOpen} />
                </div>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
            </div>
        </div>
    )
}

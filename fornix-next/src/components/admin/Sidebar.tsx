import React, { useState } from "react"
import {
    Home,
    Users,
    FileText,
    BarChart3,
    CreditCard,
    Settings,
    HelpCircle,
    LogOut,
    X,
    Building,
    Loader2
} from "lucide-react"
import SidebarItem from "./SidebarItem"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

interface SidebarProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleNavigation = (path: string) => {
        router.push(path)
        setSidebarOpen(false) // Close mobile sidebar
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            // You can add a small timeout for smoother UX (optional)
            setTimeout(() => {
                router.push("/auth/signin")
            }, 800)
        } catch (err) {
            console.error("Logout failed", err)
            setIsLoggingOut(false)
        }
    }

    return (
        <>
            {/* Sidebar */}
            <div
                className={`${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 min-w-64 bg-white shadow-sm border-r z-50 h-full`}>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Image
                                src="/images/logo-text-primary.png"
                                alt="Fornix Logo"
                                width={150}
                                height={40}
                                priority
                            />
                        </div>
                        <button
                            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
                            onClick={() => setSidebarOpen(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <nav className="px-4 space-y-2">
                    <SidebarItem
                        icon={Home}
                        label="Home"
                        active={pathname === "/admin/dashboard"}
                        onClick={() => handleNavigation("/admin/dashboard")}
                    />
                    <SidebarItem
                        icon={Users}
                        label="Users"
                        active={pathname === "/admin/users"}
                        onClick={() => handleNavigation("/admin/users")}
                    />
                    <SidebarItem
                        icon={CreditCard}
                        label="Credit Management"
                        active={pathname === "/admin/credits"}
                        onClick={() => handleNavigation("/admin/credits")}
                    />
                </nav>

                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <SidebarItem
                        icon={Building}
                        label="Manage Organization"
                        active={pathname.startsWith("/admin/organizations")}
                        onClick={() => handleNavigation("/admin/organizations")}
                    />
                    <SidebarItem
                        icon={Settings}
                        label="Settings"
                        active={pathname === "/admin/settings"}
                        onClick={() => handleNavigation("/admin/settings")}
                    />
                    <SidebarItem
                        icon={HelpCircle}
                        label="Help center"
                        onClick={() => handleNavigation("/admin/help-center")}
                    />
                    <SidebarItem icon={LogOut} label="Logout" onClick={() => setShowLogoutModal(true)} />
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Confirm Logout</h2>
                        <p className="text-sm text-gray-600 mb-5">Are you sure you want to logout of your account?</p>

                        <div className="flex justify-end gap-3">
                            {!isLoggingOut && (
                                <>
                                    <button
                                        className="px-4 py-2 rounded-md text-sm bg-gray-200 hover:bg-gray-300"
                                        onClick={() => setShowLogoutModal(false)}>
                                        No
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600"
                                        onClick={handleLogout}>
                                        Yes, Logout
                                    </button>
                                </>
                            )}

                            {isLoggingOut && (
                                <div className="flex items-center justify-center w-full">
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                    <span className="ml-2 text-sm text-gray-600">Logging out...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

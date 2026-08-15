import React from "react"
import { Search, Menu } from "lucide-react"
import useAuthStore from "../../../store/AuthStore"

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void
}

export default function Header({ setSidebarOpen }: HeaderProps) {
    const { auth } = useAuthStore()

    return (
        <header className="bg-white border-b px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {/* Mobile menu button */}
                    <button
                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="relative hidden sm:block">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-60 lg:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button className="sm:hidden p-2 text-gray-400 hover:text-gray-600">
                        <Search className="w-5 h-5" />
                    </button>
                    {/* <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Bell className="w-5 h-5" />
                    </button> */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                                {auth.name.slice(0, 1).toUpperCase()}
                            </span>
                        </div>
                        <span className="font-medium hidden sm:block">{auth.name}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

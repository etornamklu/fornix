import React from "react"
import { LucideIcon } from "lucide-react"

interface SidebarItemProps {
    icon: LucideIcon
    label: string
    active?: boolean
    onClick?: () => void
}

export default function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
    return (
        <button
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={onClick}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{label}</span>
        </button>
    )
}

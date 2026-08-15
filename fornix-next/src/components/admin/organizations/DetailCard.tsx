import React from "react"
import { Pencil } from "lucide-react"

interface DetailCardProps {
    title: string
    onEdit?: () => void
    children: React.ReactNode
}

export default function DetailCard({ title, onEdit, children }: DetailCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                        <Pencil className="w-3 h-3" />
                        Edit
                    </button>
                )}
            </div>
            <div className="p-4 space-y-3">{children}</div>
        </div>
    )
}


import React from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { PatientMedFindHistoryItem } from "@/utils/types"

interface PatientMedFindHistoryListProps {
    history: PatientMedFindHistoryItem[]
    onItemClick?: () => void
}

export const PatientMedFindHistoryList: React.FC<PatientMedFindHistoryListProps> = ({ history, onItemClick }) => {
    const handleItemClick = (sessionId: string) => {
        localStorage.setItem("pmfi", sessionId)
        window.dispatchEvent(new Event("storage"))
        if (onItemClick) {
            onItemClick()
        }
    }

    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {history.map((item, index) => (
                <div
                    key={index}
                    role="button"
                    onClick={() => handleItemClick(item.session_id)}
                    className="flex justify-between items-center text-gray-700 p-2 2xl:p-3 rounded-lg hover:font-semibold bg-gray-100 mb-2 shadow select-none cursor-pointer">
                    <div className="flex flex-col">
                        <span className="font-medium">{item.name || `Session: ${item.session_id}`}</span>
                        <span className="text-gray-400">{new Date(item.updated_at).toLocaleString()}</span>
                    </div>
                    <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full">
                        <CgArrowsExpandUpRight size={18} />
                    </div>
                </div>
            ))}
        </div>
    )
}

import React from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { MedFindHistoryItem } from "@/utils/types"

interface MedFindHistoryListProps {
    history: MedFindHistoryItem[]
    onItemClick?: () => void
}

export const MedFindHistoryList: React.FC<MedFindHistoryListProps> = ({ history, onItemClick }) => {
    if (!history || history.length === 0) {
        return null
    }

    const handleItemClick = (sessionId: string) => {
        window.localStorage.setItem("mfi", sessionId)
        window.dispatchEvent(new Event("storage"))
        if (onItemClick) {
            onItemClick()
        }
    }

    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {history.map((mfh, index) => (
                <div
                    key={index}
                    role="button"
                    onClick={() => handleItemClick(mfh.session_id)}
                    className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none">
                    {mfh.name}
                    <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full">
                        <CgArrowsExpandUpRight size={23} />
                    </div>
                </div>
            ))}
        </div>
    )
}

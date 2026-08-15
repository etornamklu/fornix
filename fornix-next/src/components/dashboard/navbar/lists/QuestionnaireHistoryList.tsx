import React from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { QuestionnaireHistoryType } from "@/utils/types"

interface QuestionnaireHistoryListProps {
    history: QuestionnaireHistoryType[]
    onItemClick: (item: QuestionnaireHistoryType) => void
}

export const QuestionnaireHistoryList: React.FC<QuestionnaireHistoryListProps> = ({ history, onItemClick }) => {
    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {history.map((item, index) => (
                <div
                    key={index}
                    role={"button"}
                    className="flex justify-between items-center text-gray-700 p-2 2xl:p-3 rounded-lg hover:font-semibold bg-gray-100 mb-2 shadow select-none cursor-pointer"
                    onClick={() => onItemClick(item)}>
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {`Conversation from ${new Date(item.created_at).toLocaleString()}`}
                        </span>
                    </div>
                    <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full">
                        <CgArrowsExpandUpRight size={18} />
                    </div>
                </div>
            ))}
        </div>
    )
}

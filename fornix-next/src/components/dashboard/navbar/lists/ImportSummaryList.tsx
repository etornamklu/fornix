import React from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { UserConnection } from "@/utils/types"

interface ImportSummaryListProps {
    connections: UserConnection[]
    onItemClick: (connection: UserConnection) => void
}

export const ImportSummaryList: React.FC<ImportSummaryListProps> = ({ connections, onItemClick }) => {
    if (!connections || connections.length === 0) {
        return null
    }

    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {connections.map((connection, index) => (
                <div
                    onClick={e => {
                        e.stopPropagation()
                        onItemClick(connection)
                    }}
                    role="button"
                    key={index}
                    className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none">
                    {connection.patient.name}
                    <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full">
                        <CgArrowsExpandUpRight size={23} />
                    </div>
                </div>
            ))}
        </div>
    )
}

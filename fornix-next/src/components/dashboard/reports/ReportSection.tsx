import React, { ReactNode } from "react"
import { AiOutlineEdit } from "react-icons/ai"
import SectionEditor from "./SectionEditor"

interface ReportSectionProps {
    sectionKey: string
    sectionData: any
    isEditing: boolean
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const renderContent = (value: any): ReactNode => {
    if (typeof value === "string" && value.trim()) {
        return <span className="whitespace-pre-wrap text-gray-700 text-sm sm:text-base">{value}</span>
    }
    if (Array.isArray(value) && value.length > 0) {
        return (
            <span className="text-gray-600 text-sm sm:text-base">
                {value.map((item, index) => (
                    <React.Fragment key={index}>
                        {renderContent(item)}
                        {index < value.length - 1 && ", "}
                    </React.Fragment>
                ))}
            </span>
        )
    }

    if (value && typeof value === "object") {
        return <span className="italic text-gray-400 text-sm sm:text-base">Complex object data</span>
    }
    return <span className="italic text-gray-400 text-sm sm:text-base">No data available</span>
}

const ReportSection: React.FC<ReportSectionProps> = ({
    sectionKey,
    sectionData,
    onStartEditing,
    isEditing,
    onSave,
    onCancel
}) => {
    if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
        return null
    }

    if (isEditing) {
        return (
            <div className="py-2">
                <h4 className="text-lg font-bold capitalize text-gray-900 pb-1 mb-1">
                    Editing {sectionKey.replace(/_/g, " ")}
                </h4>
                <SectionEditor
                    section={sectionKey}
                    initialValue={sectionData}
                    onSave={newValue => onSave(sectionKey, newValue)}
                    onCancel={() => onCancel(sectionKey)}
                />
            </div>
        )
    }

    return (
        <div className="py-2" key={sectionKey}>
            <h4 className="font-bold capitalize text-gray-900v pb-1 mb-1">{sectionKey.replace(/_/g, " ")}</h4>

            <div className="py-1 flex justify-between items-start gap-4 rounded-md mx-2 px-2 group">
                <div className="flex-grow">
                    <div className="not-prose text-justify">{renderContent(sectionData)}</div>
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={() => onStartEditing(sectionKey)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <AiOutlineEdit size={16} className="text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportSection

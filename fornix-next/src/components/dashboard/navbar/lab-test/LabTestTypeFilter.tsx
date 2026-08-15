import React, { useState, useRef } from "react"
import { FaListUl } from "react-icons/fa"
import useCloseModalOnOutsideClicked from "@/utils/hooks/useCloseModalOnOutsideClicked"
import { LabTestType } from "@/utils/types"

interface LabTestTypeFilterProps {
    onTypeSelect: (types: LabTestType[]) => void
    selectedTypes: LabTestType[]
}

export const LabTestTypeFilter: React.FC<LabTestTypeFilterProps> = ({ onTypeSelect, selectedTypes = [] }) => {
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useCloseModalOnOutsideClicked(dropdownRef, () => {
        setShowTypeDropdown(false)
    })

    const reportTypes: LabTestType[] = [
        LabTestType.BloodTest,
        LabTestType.UrineTest,
        LabTestType.StoolTest,
        LabTestType.Biopsy,
        LabTestType.CultureAndSensitivity
    ]

    const isAllSelected = selectedTypes.length === reportTypes.length && reportTypes.length > 0

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onTypeSelect(reportTypes)
        } else {
            onTypeSelect([])
        }
    }

    const handleTypeToggle = (type: LabTestType, checked: boolean) => {
        if (checked) {
            if (!selectedTypes.includes(type)) {
                onTypeSelect([...selectedTypes, type])
            }
        } else {
            onTypeSelect(selectedTypes.filter((t: LabTestType) => t !== type))
        }
    }

    const formatType = (type: string) => type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                    selectedTypes.length > 0 ? "bg-blue-100 text-blue-600" : "text-gray-600"
                }`}
                title={
                    selectedTypes.length > 0
                        ? `Filtered by: ${selectedTypes.length} type${selectedTypes.length === 1 ? "" : "s"}`
                        : "Filter by type"
                }>
                <FaListUl size={22} />
                {selectedTypes.length > 0 && (
                    <span className="absolute -top-1 -right-0 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedTypes.length}
                    </span>
                )}
            </button>

            {showTypeDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto min-w-48">
                    {/* Select All Option */}
                    <div className="px-3 py-2 border-b border-gray-200">
                        <label className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <span className="font-medium">All Types</span>
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={e => {
                                    e.stopPropagation()
                                    handleSelectAll(e.target.checked)
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                onClick={e => e.stopPropagation()}
                            />
                        </label>
                    </div>

                    {/* Type List */}
                    <div className="max-h-40 overflow-y-auto">
                        {reportTypes.map(type => (
                            <div key={type} className="px-3 py-1">
                                <label className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <span>{formatType(type)}</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes(type)}
                                        onChange={e => {
                                            e.stopPropagation()
                                            handleTypeToggle(type, e.target.checked)
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        onClick={e => e.stopPropagation()}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export type LabTestReportType = LabTestType
export default LabTestTypeFilter

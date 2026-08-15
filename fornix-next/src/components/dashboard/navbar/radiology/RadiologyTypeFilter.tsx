import React, { useState, useRef } from "react"
import { FaListUl } from "react-icons/fa"
import useCloseModalOnOutsideClicked from "@/utils/hooks/useCloseModalOnOutsideClicked"

export type RadiologyReportType = "ECG" | "X-Ray" | "Ultrasound"

interface RadiologyTypeFilterProps {
    onTypeSelect: (types: RadiologyReportType[]) => void
    selectedTypes: RadiologyReportType[]
}

export const RadiologyTypeFilter: React.FC<RadiologyTypeFilterProps> = ({ onTypeSelect, selectedTypes = [] }) => {
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useCloseModalOnOutsideClicked(dropdownRef, () => {
        setShowTypeDropdown(false)
    })

    const reportTypes: RadiologyReportType[] = ["ECG", "X-Ray", "Ultrasound"].map(
        type => type.toUpperCase() as RadiologyReportType
    )

    // Check if all types are selected
    const isAllSelected = selectedTypes.length === reportTypes.length && reportTypes.length > 0

    // Handle select/unselect all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onTypeSelect(reportTypes)
        } else {
            onTypeSelect([])
        }
    }

    // Handle individual type selection
    const handleTypeToggle = (type: RadiologyReportType, checked: boolean) => {
        if (checked) {
            if (!selectedTypes.includes(type)) {
                onTypeSelect([...selectedTypes, type])
            }
        } else {
            onTypeSelect(selectedTypes.filter(t => t !== type))
        }
    }

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

            {/* Type Dropdown */}
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
                                    <span>{type}</span>
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

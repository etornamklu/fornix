import React, { useState } from "react"
import { FaCheck } from "react-icons/fa"
import { CgClose } from "react-icons/cg"

// This recursive component can render an editor for any object, no matter how nested.
const ObjectEditor = ({
    data,
    onDataChange
}: {
    data: Record<string, any>
    onDataChange: (newData: Record<string, any>) => void
}) => {
    const handleInputChange = (field: string, value: string) => {
        onDataChange({ ...data, [field]: value })
    }

    const handleNestedChange = (field: string, nestedData: Record<string, any>) => {
        onDataChange({ ...data, [field]: nestedData })
    }

    return (
        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                        {key.replace(/_/g, " ")}
                    </label>
                    {typeof value === "object" && value !== null && !Array.isArray(value) ? (
                        <ObjectEditor data={value} onDataChange={newData => handleNestedChange(key, newData)} />
                    ) : (
                        <input
                            type="text"
                            value={Array.isArray(value) ? value.join(", ") : value || ""}
                            onChange={e => handleInputChange(key, e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

interface PhysicalExaminationSectionEditorProps {
    section: string
    initialData: any // Using `any` to flexibly handle all possible data shapes.
    onSave: (data: any) => void
    onCancel: () => void
}

const PhysicalExaminationSectionEditor: React.FC<PhysicalExaminationSectionEditorProps> = ({
    section,
    initialData,
    onSave,
    onCancel
}) => {
    const [editedData, setEditedData] = useState(initialData)

    // If the data is just a simple string, render a textarea.
    if (typeof editedData !== "object" || editedData === null) {
        return (
            <div className="space-y-4 mt-2 p-4 border rounded-lg bg-gray-50">
                <textarea
                    value={editedData || ""}
                    onChange={e => setEditedData(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={5}
                />
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => onSave(editedData)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FaCheck size={18} className="text-green-600" />
                    </button>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <CgClose size={18} className="text-gray-600" />
                    </button>
                </div>
            </div>
        )
    }

    // If the data is an object, use our recursive ObjectEditor.
    return (
        <div className="space-y-4 mt-2 p-4 border rounded-lg bg-gray-50">
            <ObjectEditor data={editedData} onDataChange={setEditedData} />
            <div className="flex gap-2 pt-2">
                <button
                    onClick={() => onSave(editedData)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaCheck size={18} className="text-green-600" />
                </button>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <CgClose size={18} className="text-gray-600" />
                </button>
            </div>
        </div>
    )
}

export default PhysicalExaminationSectionEditor

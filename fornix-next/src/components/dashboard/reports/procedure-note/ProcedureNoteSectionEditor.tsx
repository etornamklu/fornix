import React, { useState } from "react"
import { FaCheck } from "react-icons/fa"
import { CgClose } from "react-icons/cg"

const ObjectEditor = ({
    data,
    onDataChange
}: {
    data: Record<string, any>
    onDataChange: (newData: Record<string, any>) => void
}) => {
    // This handles changes for simple string inputs
    const handleInputChange = (field: string, value: string) => {
        onDataChange({ ...data, [field]: value })
    }

    // This handles changes coming from a nested ObjectEditor component
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

interface ProcedureNoteSectionEditorProps {
    section: string
    initialData: any
    onSave: (data: Record<string, any> | string) => void
    onCancel: () => void
}

const ProcedureNoteSectionEditor: React.FC<ProcedureNoteSectionEditorProps> = ({
    section,
    initialData,
    onSave,
    onCancel
}) => {
    const [editedData, setEditedData] = useState(initialData)

    if (typeof editedData === "string" || typeof editedData === "undefined" || editedData === null) {
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

export default ProcedureNoteSectionEditor

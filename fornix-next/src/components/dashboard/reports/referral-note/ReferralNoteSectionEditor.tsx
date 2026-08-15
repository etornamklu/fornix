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
    const handleChange = (field: string, value: string | string[]) => {
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
                    ) : Array.isArray(value) ? (
                        <textarea
                            value={value.join("\n")}
                            onChange={e => handleChange(key, e.target.value.split("\n"))}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={value.length > 2 ? value.length : 3}
                        />
                    ) : (
                        <input
                            type="text"
                            value={value || ""}
                            onChange={e => handleChange(key, e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

interface ReferralNoteSectionEditorProps {
    section: string
    initialData: any
    onSave: (data: any) => void
    onCancel: () => void
}

const ReferralNoteSectionEditor: React.FC<ReferralNoteSectionEditorProps> = ({
    section,
    initialData,
    onSave,
    onCancel
}) => {
    const [editedData, setEditedData] = useState(initialData)

    const handleSave = () => {
        if (Array.isArray(initialData)) {
            const asString = typeof editedData === "string" ? editedData : ""
            onSave(asString.split("\n").filter(line => line.trim() !== ""))
        } else {
            onSave(editedData)
        }
    }

    if (
        typeof editedData === "string" ||
        Array.isArray(editedData) ||
        editedData === undefined ||
        editedData === null
    ) {
        return (
            <div className="space-y-4 mt-2 p-4 border rounded-lg bg-gray-50">
                <textarea
                    value={Array.isArray(editedData) ? editedData.join("\n") : editedData || ""}
                    onChange={e => setEditedData(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={5}
                />
                <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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

export default ReferralNoteSectionEditor

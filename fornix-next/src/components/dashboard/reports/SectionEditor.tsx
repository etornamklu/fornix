import React, { useState, useRef, useEffect } from "react"
import { FaCheck } from "react-icons/fa"
import { CgClose } from "react-icons/cg"

interface SectionEditorProps {
    section: string
    initialValue: any
    onSave: (value: any) => void
    onCancel: () => void
}

const SectionEditor: React.FC<SectionEditorProps> = ({ section, initialValue, onSave, onCancel }) => {
    const [value, setValue] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (typeof initialValue === "string") {
            setValue(initialValue)
        } else if (typeof initialValue === "object" && initialValue !== null) {
            setValue(JSON.stringify(initialValue, null, 2))
        }
    }, [initialValue])

    const handleSave = () => {
        try {
            const parsedValue = JSON.parse(value)
            onSave(parsedValue)
        } catch (e) {
            onSave(value)
        }
    }

    return (
        <div className="space-y-2 mt-2">
            <textarea
                ref={textareaRef}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-vertical text-sm sm:text-base font-mono bg-gray-50"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={`Enter JSON or plain text for ${section.replace(/_/g, " ")}...`}
            />
            <div className="flex gap-2">
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

export default SectionEditor

import { useState, ChangeEvent, useRef } from "react"
import { Upload, Image, FileText, AlertCircle, Send, X } from "lucide-react"
import Select, { SingleValue, StylesConfig } from "react-select"
import React from "react"

import { LabTestType } from "@/utils/types"

type ReportOption = { value: string; label: string }

interface LabTestFormData {
    reportType: SingleValue<ReportOption>
    uploadedFiles: File[]
    clinicalInformation: string
}

interface LabTestFormProps {
    onSubmit: (data: LabTestFormData) => void
}

const formatEnumKey = (key: string) => {
    return key.replace(/([A-Z])/g, " $1").trim()
}

export default function LabTestAnalysis({ onSubmit }: LabTestFormProps) {
    const [reportType, setReportType] = useState<SingleValue<ReportOption>>(null)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [clinicalInformation, setClinicalInformation] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const MAX_CLINICAL_INFO_LENGTH = 4000

    const reportTypeOptions: ReportOption[] = Object.entries(LabTestType).map(([key, value]) => ({
        value: value,
        label: formatEnumKey(key)
    }))

    const customStyles: StylesConfig<ReportOption, false> = {
        control: base => ({
            ...base,
            minHeight: "40px",
            borderRadius: "8px",
            opacity: isSubmitting ? 0.5 : 1
        }),
        indicatorSeparator: () => ({ display: "none" })
    }

    const handleFiles = (files: File[]) => {
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
        const filtered = files.filter(file => validTypes.includes(file.type))
        setUploadedFiles(prev => [...prev, ...filtered])
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files))
        }
    }

    const onButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleSubmit = async () => {
        if (!reportType || uploadedFiles.length === 0) {
            alert("Please select a report type and upload at least one file.")
            return
        }
        setIsSubmitting(true)

        await onSubmit({ reportType, uploadedFiles, clinicalInformation })

        setIsSubmitting(false)
    }

    const removeFile = (index: number) => {
        setUploadedFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index)
            if (newFiles.length === 0 && fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            return newFiles
        })
    }

    return (
        <div className="w-full h-full max-w-4xl mx-auto py-6 overflow-y-auto overflow-x-hidden">
            <h2 className="text-3xl font-bold text-center mb-4">Lab Test Analysis</h2>

            <div className="grid gap-6">
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-base font-semibold mb-2">Test Type</h3>
                    <Select<ReportOption>
                        options={reportTypeOptions}
                        value={reportType}
                        onChange={option => setReportType(option)}
                        styles={customStyles}
                        isDisabled={isSubmitting}
                        placeholder="Select test type"
                    />
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-base font-semibold mb-3">Upload Images</h3>
                    <div
                        className="relative border-2 border-dashed border-blue-300 rounded p-6 text-center hover:border-blue-400 transition"
                        onClick={onButtonClick}>
                        <input
                            id="fileInput"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleChange}
                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                            disabled={isSubmitting}
                        />
                        <div className="flex flex-col items-center space-y-2">
                            <Image className="w-6 h-6 text-blue-500" />
                            <p className="text-sm text-gray-600">Click or drop files here to upload.</p>
                            <p className="text-xs text-gray-400">
                                PNG, JPG, JPEG, WEBP, or PDF. Multiple files supported.
                            </p>
                        </div>
                    </div>
                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 max-h-64 overflow-y-auto overflow-x-hidden space-y-2">
                            {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                                    <div className="flex items-center gap-2 text-sm text-gray-800 flex-1 min-w-0">
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate max-w-[200px] sm:max-w-[300px]">{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        disabled={isSubmitting}
                                        className="flex-shrink-0 ml-2">
                                        <X className="w-4 h-4 text-red-500 hover:text-red-700" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-base font-semibold mb-2">Clinical Information</h3>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded resize-none min-h-[100px] text-sm outline-none"
                        placeholder="Provide patient symptoms, history, or notes for the analysis..."
                        value={clinicalInformation}
                        onChange={e => {
                            if (e.target.value.length <= MAX_CLINICAL_INFO_LENGTH) {
                                setClinicalInformation(e.target.value)
                            }
                        }}
                        disabled={isSubmitting}
                        maxLength={MAX_CLINICAL_INFO_LENGTH}
                    />
                    <div className="mt-2 text-xs text-gray-500 text-right">
                        {clinicalInformation.length} / {MAX_CLINICAL_INFO_LENGTH} characters
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reportType || uploadedFiles.length === 0}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
                        isSubmitting || !reportType || uploadedFiles.length === 0
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}>
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Get Analysis
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

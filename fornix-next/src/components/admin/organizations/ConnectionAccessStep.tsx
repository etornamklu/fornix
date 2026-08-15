import React from "react"
import { CreateOrganizationRequest } from "@/utils/types"
import CustomSelect from "@/components/ui/selectInput"

interface ConnectionAccessStepProps {
    formData: CreateOrganizationRequest
    updateFormData: (field: keyof CreateOrganizationRequest, value: any) => void
}

export default function ConnectionAccessStep({ formData, updateFormData }: ConnectionAccessStepProps) {
    const connectionOptions = [
        { label: "All - All roles get automatic access", value: "all" },
        { label: "Restricted - Each role needs permission", value: "restricted" }
    ]

    const getCurrentLabel = () => {
        const option = connectionOptions.find(opt => opt.value === formData.connection_access)
        return option ? option.label : connectionOptions[0].label
    }

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                <CustomSelect
                    options={connectionOptions}
                    defaultValue={getCurrentLabel()}
                    onSelect={value => updateFormData("connection_access", value)}
                />
            </div>
        </div>
    )
}

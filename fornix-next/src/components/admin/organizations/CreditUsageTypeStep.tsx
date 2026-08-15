import React from "react"
import { CreateOrganizationRequest } from "@/utils/types"
import CustomSelect from "@/components/ui/selectInput"

interface CreditUsageTypeStepProps {
    formData: CreateOrganizationRequest
    updateFormData: (field: keyof CreateOrganizationRequest, value: any) => void
}

export default function CreditUsageTypeStep({ formData, updateFormData }: CreditUsageTypeStepProps) {
    const creditUsageOptions = [
        { label: "Pool - All credits shared across organization", value: "pool" },
        { label: "Individual - Credits allocated per user", value: "individual" },
        { label: "Role - Credits allocated per role", value: "role" }
    ]

    const getCurrentLabel = () => {
        const option = creditUsageOptions.find(opt => opt.value === formData.credit_usage_type)
        return option ? option.label : creditUsageOptions[0].label
    }

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Usage Type</label>
                <CustomSelect
                    options={creditUsageOptions}
                    defaultValue={getCurrentLabel()}
                    onSelect={value => updateFormData("credit_usage_type", value)}
                />
                <p className="mt-2 text-sm text-gray-500">
                    Choose how credits will be managed and distributed in your organization
                </p>
            </div>
        </div>
    )
}

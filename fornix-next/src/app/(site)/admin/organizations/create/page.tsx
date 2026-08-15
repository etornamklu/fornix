"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import BasicInfoStep from "@/components/admin/organizations/BasicInfoStep"
import CreditUsageTypeStep from "@/components/admin/organizations/CreditUsageTypeStep"
import ConnectionAccessStep from "@/components/admin/organizations/ConnectionAccessStep"
import ReviewStep from "@/components/admin/organizations/ReviewStep"
import { CreateOrganizationRequest, Organization } from "@/utils/types"
import { createOrganization, getImageUrl } from "@/services/admin/organization.service"
import useAuthStore from "../../../../../../store/AuthStore"

const formStepData = [
    {
        heading: "1. Basic Organization Information",
        description: ""
    },
    {
        heading: "2. Credit Usage Type",
        description: "Choose how credits will be allocated in your organization"
    },
    {
        heading: "3. Connection Access",
        description: "Set patient data access permissions"
    },
    {
        heading: "4. Review & Submit",
        description: "Review all settings before creating your organization"
    }
]

// Success Screen Component with Auto-redirect
function SuccessScreen({ organization, onGoToDashboard }: { organization: Organization; onGoToDashboard: () => void }) {
    const [countdown, setCountdown] = useState(3)

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Use setTimeout to defer the navigation to after the render
                    setTimeout(() => onGoToDashboard(), 0)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [onGoToDashboard])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onGoToDashboard}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                    Go to Dashboard
                </button>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
                {/* Success Icon and Message */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Created Successfully!</h1>
                    <p className="text-gray-600 mb-4">
                        Redirecting to dashboard in {countdown} second{countdown !== 1 ? "s" : ""}...
                    </p>
                </div>

                {/* Organization Card */}
                <div className="bg-gray-50 rounded-lg p-6 inline-block">
                    <div className="flex items-center space-x-4">
                        {/* Profile Picture */}
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {organization.profile_picture_id ? (
                                <img
                                    src={getImageUrl(organization.profile_picture_id)}
                                    alt="Organization Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-500 text-xl font-bold">
                                        {organization.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Organization Name */}
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-gray-900">{organization.name}</h2>
                            <p className="text-sm text-gray-500">{organization.description}</p>
                        </div>
                    </div>
                </div>

                {/* Manual Redirect Button */}
                <div className="mt-6">
                    <button
                        onClick={onGoToDashboard}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Go to Dashboard Now
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CreateOrganizationPage() {
    const router = useRouter()
    const { auth, updateAuth } = useAuthStore()
    const [currentStep, setCurrentStep] = useState(0)

    const [formData, setFormData] = useState<CreateOrganizationRequest>({
        name: "",
        description: "",
        profile_picture_id: undefined,
        credit_usage_type: "pool",
        connection_access: "all"
    })

    const updateFormData = (field: keyof CreateOrganizationRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return <BasicInfoStep formData={formData} updateFormData={updateFormData} />
            case 1:
                return <CreditUsageTypeStep formData={formData} updateFormData={updateFormData} />
            case 2:
                return <ConnectionAccessStep formData={formData} updateFormData={updateFormData} />
            case 3:
                return <ReviewStep formData={formData} />
            default:
                return <BasicInfoStep formData={formData} updateFormData={updateFormData} />
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return formData.name.trim() !== "" && formData.description.trim() !== ""
            case 1:
                return true // credit_usage_type always has a valid default value
            case 2:
                return true // connection_access always has a valid default value
            case 3:
                return true
            default:
                return true
        }
    }

    const handleNext = () => {
        if (currentStep < formStepData.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const [createdOrg, setCreatedOrg] = useState<Organization | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const handleSubmit = async () => {
        setIsCreating(true) // Start loading
        try {
            const result = await createOrganization(formData)

            if (result.success && result.data) {
                setCreatedOrg(result.data)

                // Refresh the user's data to get the updated token with organization_id
                await updateAuth()
            } else {
                console.error("Failed to create organization:", result.error)
                alert(`Failed to create organization: ${result.error}`)
            }
        } catch (error) {
            console.error("Error creating organization:", error)
            alert("An unexpected error occurred. Please try again.")
        } finally {
            setIsCreating(false) // Stop loading
        }
    }

    if (createdOrg) {
        return <SuccessScreen organization={createdOrg} onGoToDashboard={() => router.push("/admin/dashboard")} />
    }

    return (
        <div className="flex flex-col h-full">
            {/* Fixed Header - never scrolls */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-start gap-6">
                    <button
                        onClick={() => router.push("/admin/organizations")}
                        className="flex-shrink-0 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                        View Organization
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
                    </div>
                </div>
            </div>

            {/* Scrollable Form Area - unified white background */}
            <div className="flex-1 overflow-y-auto bg-white">
                <div className="flex gap-6 p-6">
                    {/* Left space for button alignment */}
                    <div className="flex-shrink-0 w-[140px]"></div>

                    {/* Main content area - aligned */}
                    <div className="flex-1 w-full lg:w-[700px]">
                        <div className="w-full lg:w-fit flex items-center gap-4 mb-6">
                            <div className="w-8 h-8 rounded-full border-4 border-gray-200 flex items-center justify-center">
                                <div
                                    className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
                                    style={{
                                        background: `conic-gradient(#2563eb ${(currentStep + 1) * 25}%, #e5e7eb 0%)`
                                    }}>
                                    {currentStep + 1}
                                </div>
                            </div>
                            <span className="text-sm lg:text-xl font-semibold">
                                {formStepData[currentStep].heading}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <div className="mb-4">
                                <p className="text-gray-600">{formStepData[currentStep].description}</p>
                            </div>

                            <div className="mb-6">{renderCurrentStep()}</div>

                            <div className="flex justify-between">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handleBack}
                                        className="px-4 py-2 rounded-xl text-lg text-gray-500 border cursor-pointer hover:bg-blue-300 hover:text-white">
                                        Back
                                    </button>
                                )}

                                <div className="ml-auto">
                                    {currentStep < formStepData.length - 1 ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={!canProceed()}
                                            className="bg-blue-50 px-4 py-2 rounded-xl text-lg text-blue-600 shadow-sm border cursor-pointer hover:bg-blue-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                                            Continue
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isCreating}
                                            className="bg-blue-500 px-4 py-2 flex justify-between gap-2 items-center rounded-xl text-lg text-white shadow-sm border cursor-pointer hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isCreating ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Building className="w-5 h-5" />
                                                    Create Organization
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

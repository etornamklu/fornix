import React from "react"
import { CreateOrganizationRequest } from "@/utils/types"
import { getImageUrl } from "@/services/admin/organization.service"

interface ReviewStepProps {
    formData: CreateOrganizationRequest
}

export default function ReviewStep({ formData }: ReviewStepProps) {
    const formatCredits = () => {
        return "Will be configured by backend"
    }

    const formatDailyLimits = () => {
        return "Will be configured by backend"
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Organization</h3>
                <p className="text-gray-600 mb-6">Review all the information before creating your organization.</p>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Organization Name:</span>
                            <span className="font-medium">{formData.name || "Not provided"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Description:</span>
                            <span className="font-medium">{formData.description || "Not provided"}</span>
                        </div>
                        {formData.profile_picture_id && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Profile Picture:</span>
                                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={getImageUrl(formData.profile_picture_id)}
                                        alt="Organization profile preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Credits Configuration</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Credit Usage Type:</span>
                            <span className="font-medium capitalize">{formData.credit_usage_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Credit Allocation:</span>
                            <span className="font-medium text-sm">{formatCredits()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Connection Access</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Connection Access:</span>
                            <span className="font-medium capitalize">{formData.connection_access}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Daily Limits</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Daily Credit Limits:</span>
                            <span className="font-medium text-sm">{formatDailyLimits()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Ready to Create</h4>
                    <p className="text-blue-700 text-sm">
                        Your organization will be created with the settings above. You can modify settings after
                    </p>
                </div>
            </div>
        </div>
    )
}

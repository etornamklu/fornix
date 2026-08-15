import React, { useRef, useState } from "react"
import Input from "@/components/ui/input"
import Textarea from "@/components/ui/textarea"
import { CreateOrganizationRequest } from "@/utils/types"
import { Image } from "lucide-react"
import { uploadImage, getImageUrl } from "@/services/admin/organization.service"

interface BasicInfoStepProps {
    formData: CreateOrganizationRequest
    updateFormData: (field: keyof CreateOrganizationRequest, value: any) => void
}

export default function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setIsUploading(true)
            try {
                const result = await uploadImage(file)
                if (result.success && result.data) {
                    updateFormData("profile_picture_id", result.data)
                } else {
                    console.error("Upload failed:", result.error)
                    alert(`Upload failed: ${result.error}`)
                }
            } catch (error) {
                console.error("Upload error:", error)
                alert("Upload failed. Please try again.")
            } finally {
                setIsUploading(false)
            }
        }
    }

    const onButtonClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name *
                    </label>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={e => updateFormData("name", e.target.value)}
                        placeholder="Enter organization name"
                        sx="mt-1"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                    </label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => updateFormData("description", e.target.value)}
                        placeholder="Describe your organization"
                        rows={3}
                        className="mt-1"
                    />
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700">
                            Profile Picture
                        </label>
                        <span className="text-xs text-gray-500">Optional: Upload organization logo or image</span>
                    </div>
                    {formData.profile_picture_id ? (
                        <div className="relative">
                            <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                <img
                                    src={getImageUrl(formData.profile_picture_id)}
                                    alt="Organization profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={onButtonClick}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                                Change image
                            </button>
                            <input
                                id="profile_picture"
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                        </div>
                    ) : (
                        <div
                            className={`relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition cursor-pointer ${
                                isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"
                            }`}
                            onClick={isUploading ? undefined : onButtonClick}>
                            <input
                                id="profile_picture"
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                                disabled={isUploading}
                            />
                            <div className="flex flex-col items-center space-y-2">
                                <Image className="w-6 h-6 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                    {isUploading ? "Uploading..." : "Click to upload image"}
                                </p>
                                <p className="text-xs text-gray-400">PNG, JPG, JPEG, or WEBP. Max 5MB.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

import React, { useState, useRef } from "react"
import { Organization } from "@/utils/types"
import DetailCard from "./DetailCard"
import { Edit2, Camera, X } from "lucide-react"
import { FaCheck } from "react-icons/fa"
import { getImageUrl } from "@/services/admin/organization.service"
import { updateOrganization } from "@/services/organization/credit.service"
import { useRouter } from "next/navigation"

interface OrganizationDetailsViewProps {
    organization: Organization
    onOrganizationUpdate?: (updatedOrg: Organization) => void
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">{label}:</span>
        <span className="font-medium text-gray-800 capitalize">{value}</span>
    </div>
)

export default function OrganizationDetailsView({ organization, onOrganizationUpdate }: OrganizationDetailsViewProps) {
    const router = useRouter()
    const [editingField, setEditingField] = useState<
        "name" | "description" | "connection_access" | "daily_limits" | "credit_usage_type" | null
    >(null)
    const [editedName, setEditedName] = useState(organization.name)
    const [editedDescription, setEditedDescription] = useState(organization.description)
    const [editedConnectionAccess, setEditedConnectionAccess] = useState(organization.connection_access)
    const [editedDailyLimits, setEditedDailyLimits] = useState(
        organization.daily_credit_limit || { pool: 0, individual: 0, role: { doctor: 0, radiologist: 0, pharmacy: 0 } }
    )
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleProfilePictureClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // File selected
        }
    }

    const startEditing = (
        field: "name" | "description" | "connection_access" | "daily_limits" | "credit_usage_type"
    ) => {
        setEditingField(field)
    }

    const cancelEditing = () => {
        setEditingField(null)
        setEditedName(organization.name)
        setEditedDescription(organization.description)
        setEditedConnectionAccess(organization.connection_access)
        setEditedDailyLimits(organization.daily_credit_limit)
    }

    const handleNameSave = async () => {
        try {
            const updatedOrg = await updateOrganization({ name: editedName })
            onOrganizationUpdate?.(updatedOrg)
            setEditingField(null)
        } catch (error) {
            console.error("Failed to update name:", error)
            alert("Failed to update organization name")
        }
    }

    const handleDescriptionSave = async () => {
        try {
            const updatedOrg = await updateOrganization({ description: editedDescription })
            onOrganizationUpdate?.(updatedOrg)
            setEditingField(null)
        } catch (error) {
            console.error("Failed to update description:", error)
            alert("Failed to update organization description")
        }
    }

    const handleConnectionAccessSave = async () => {
        try {
            const updatedOrg = await updateOrganization({ connection_access: editedConnectionAccess })
            onOrganizationUpdate?.(updatedOrg)
            setEditingField(null)
        } catch (error) {
            console.error("Failed to update connection access:", error)
            alert("Failed to update connection access")
        }
    }

    const handleDailyLimitsSave = async () => {
        try {
            const updatedOrg = await updateOrganization({ daily_credit_limit: editedDailyLimits })
            onOrganizationUpdate?.(updatedOrg)
            setEditingField(null)
        } catch (error) {
            console.error("Failed to update daily limits:", error)
            alert("Failed to update daily limits")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 relative group">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer">
                        {organization.profile_picture_id ? (
                            <img
                                src={getImageUrl(organization.profile_picture_id)}
                                alt="Organization Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-500 text-2xl font-bold">
                                    {organization.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <button
                        onClick={handleProfilePictureClick}
                        className="absolute inset-0 w-full h-full rounded-full"
                        aria-label="Change profile picture"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="group relative">
                        {editingField === "name" ? (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={e => setEditedName(e.target.value)}
                                    className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                                    style={{ width: `${editedName.length + 2}ch` }}
                                    autoFocus
                                />
                                <button
                                    onClick={handleNameSave}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title="Save">
                                    <FaCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Cancel">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                                <button
                                    onClick={() => startEditing("name")}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 p-1">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="group relative">
                        {editingField === "description" ? (
                            <div className="flex items-start space-x-2">
                                <textarea
                                    value={editedDescription}
                                    onChange={e => setEditedDescription(e.target.value)}
                                    className="text-lg text-gray-600 bg-transparent border-b-2 border-blue-500 focus:outline-none resize-none"
                                    style={{ width: `${Math.max(editedDescription.length, 20)}ch` }}
                                    rows={1}
                                    autoFocus
                                />
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={handleDescriptionSave}
                                        className="text-green-600 hover:text-green-700 p-1"
                                        title="Save">
                                        <FaCheck className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        className="text-gray-500 hover:text-gray-700 p-1"
                                        title="Cancel">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start space-x-3">
                                <p className="text-lg text-gray-600">{organization.description}</p>
                                <button
                                    onClick={() => startEditing("description")}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 mt-1 p-1">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DetailCard title="Credits Configuration" onEdit={() => startEditing("credit_usage_type")}>
                {editingField === "credit_usage_type" ? (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Credit Usage Type:</span>
                        <div className="flex items-center space-x-2">
                            <select
                                value={organization.credit_usage_type}
                                onChange={e => {
                                    const newType = e.target.value as "pool" | "individual" | "role"
                                    // Update the organization with new credit usage type
                                    updateOrganization({ credit_usage_type: newType }).then(updated => {
                                        if (onOrganizationUpdate) {
                                            onOrganizationUpdate(updated)
                                        }
                                    })
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm">
                                <option value="pool">Pool</option>
                                <option value="individual">Individual</option>
                                <option value="role">Role</option>
                            </select>
                            <button
                                onClick={cancelEditing}
                                className="text-gray-500 hover:text-gray-700 p-1"
                                title="Done">
                                <FaCheck className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <DetailRow label="Credit Usage Type" value={organization.credit_usage_type} />
                )}

                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <strong>Note:</strong> To view and modify credit allocations, use the{" "}
                    <button
                        onClick={() => router.push("/admin/credits")}
                        className="underline hover:text-blue-800 font-medium">
                        Credit Management
                    </button>{" "}
                    section in the admin dashboard.
                </div>
            </DetailCard>

            <DetailCard title="Connection Access" onEdit={() => startEditing("connection_access")}>
                {editingField === "connection_access" ? (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Connection Access:</span>
                        <div className="flex items-center space-x-2">
                            <select
                                value={editedConnectionAccess}
                                onChange={e => setEditedConnectionAccess(e.target.value as "all" | "restricted")}
                                className="px-2 py-1 border border-gray-300 rounded text-sm">
                                <option value="all">All</option>
                                <option value="restricted">Restricted</option>
                            </select>
                            <button
                                onClick={handleConnectionAccessSave}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="Save">
                                <FaCheck className="w-4 h-4" />
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="text-gray-500 hover:text-gray-700 p-1"
                                title="Cancel">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <DetailRow label="Connection Access" value={organization.connection_access} />
                )}
            </DetailCard>

            <DetailCard title="Daily Limits" onEdit={() => startEditing("daily_limits")}>
                {/* Show daily limits based on credit_usage_type */}
                {organization.credit_usage_type === "pool" &&
                    (editingField === "daily_limits" ? (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Daily Pool Limit:</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    value={editedDailyLimits.pool}
                                    onChange={e =>
                                        setEditedDailyLimits({
                                            ...editedDailyLimits,
                                            pool: parseInt(e.target.value) || 0
                                        })
                                    }
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                    onClick={handleDailyLimitsSave}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title="Save">
                                    <FaCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Cancel">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <DetailRow
                            label="Daily Pool Limit"
                            value={organization.daily_credit_limit?.pool ?? "Not set"}
                        />
                    ))}

                {organization.credit_usage_type === "individual" &&
                    (editingField === "daily_limits" ? (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Daily Individual Limit:</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    value={editedDailyLimits.individual}
                                    onChange={e =>
                                        setEditedDailyLimits({
                                            ...editedDailyLimits,
                                            individual: parseInt(e.target.value) || 0
                                        })
                                    }
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                    onClick={handleDailyLimitsSave}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title="Save">
                                    <FaCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Cancel">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <DetailRow
                            label="Daily Individual Limit"
                            value={organization.daily_credit_limit?.individual ?? "Not set"}
                        />
                    ))}

                {organization.credit_usage_type === "role" &&
                    (editingField === "daily_limits" ? (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Daily Doctor Limit:</span>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={editedDailyLimits.role.doctor}
                                        onChange={e =>
                                            setEditedDailyLimits({
                                                ...editedDailyLimits,
                                                role: {
                                                    ...editedDailyLimits.role,
                                                    doctor: parseInt(e.target.value) || 0
                                                }
                                            })
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Daily Radiologist Limit:</span>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={editedDailyLimits.role.radiologist}
                                        onChange={e =>
                                            setEditedDailyLimits({
                                                ...editedDailyLimits,
                                                role: {
                                                    ...editedDailyLimits.role,
                                                    radiologist: parseInt(e.target.value) || 0
                                                }
                                            })
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Daily Pharmacy Limit:</span>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={editedDailyLimits.role.pharmacy}
                                        onChange={e =>
                                            setEditedDailyLimits({
                                                ...editedDailyLimits,
                                                role: {
                                                    ...editedDailyLimits.role,
                                                    pharmacy: parseInt(e.target.value) || 0
                                                }
                                            })
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-2">
                                <button
                                    onClick={handleDailyLimitsSave}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title="Save">
                                    <FaCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Cancel">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DetailRow
                                label="Daily Doctor Limit"
                                value={organization.daily_credit_limit?.role?.doctor ?? "Not set"}
                            />
                            <DetailRow
                                label="Daily Radiologist Limit"
                                value={organization.daily_credit_limit?.role?.radiologist ?? "Not set"}
                            />
                            <DetailRow
                                label="Daily Pharmacy Limit"
                                value={organization.daily_credit_limit?.role?.pharmacy ?? "Not set"}
                            />
                        </>
                    ))}
            </DetailCard>
        </div>
    )
}

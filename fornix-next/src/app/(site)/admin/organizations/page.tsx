"use client"

import React, { useEffect, useState } from "react"
import { Plus, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { getOrganizations } from "@/services/admin/organization.service"
import { Organization } from "@/utils/types"
import useAuthStore from "../../../../../store/AuthStore"
import OrganizationDetailsView from "@/components/admin/organizations/OrganizationDetailsView"

export default function OrganizationsPage() {
    const router = useRouter()
    const { auth } = useAuthStore()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrganization = async () => {
            console.log("Fetching organizations...")
            const result = await getOrganizations()
            console.log("Organizations result:", result)

            if (result.success && result.data) {
                console.log("Setting organization:", result.data)
                setOrganization(result.data) // Set the organization directly
            } else {
                console.log("No organizations found or error:", result.error)
            }
            setLoading(false)
        }

        fetchOrganization()
    }, [])

    const handleCreateOrganization = () => {
        router.push("/admin/organizations/create")
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {!organization && (
                <div className="flex justify-end">
                    <button
                        onClick={handleCreateOrganization}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Organization
                    </button>
                </div>
            )}

            {!organization ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No organization yet</h3>
                    <p className="text-gray-600 mb-6">Get started by creating an organization.</p>
                    <button
                        onClick={handleCreateOrganization}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" />
                        Create Your Organization
                    </button>
                </div>
            ) : (
                <OrganizationDetailsView
                    organization={organization}
                    onOrganizationUpdate={updatedOrg => setOrganization(updatedOrg)}
                />
            )}
        </div>
    )
}

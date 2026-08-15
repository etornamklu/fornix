"use client"

import React, { useEffect, useState } from "react"
import { Plus, MoreVertical } from "lucide-react"
import { getOrganization } from "@/services/organization/credit.service"
import { Organization } from "@/utils/types"
import { getOrganizationUsersClient, OrganizationUser } from "@/services/admin/organization.service"
import CreditPurchaseModal from "./CreditPurchaseModal"
import CreditAllocationModal from "./CreditAllocationModal"
import IndividualUserAllocationModal from "./IndividualUserAllocationModal"

export default function CreditManagement() {
    const [creditUsageType, setCreditUsageType] = useState<"pool" | "individual" | "role">("pool")
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    const [showAllocationModal, setShowAllocationModal] = useState(false)
    const [showIndividualUserModal, setShowIndividualUserModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null)
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [users, setUsers] = useState<OrganizationUser[]>([])
    const [selectedRole, setSelectedRole] = useState<"doctor" | "radiologist" | "pharmacy">("doctor")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const org = await getOrganization()
                console.log("CreditManagement - Organization data:", org)
                console.log("CreditManagement - Pool credits:", org.credits)
                setOrganization(org)
                setCreditUsageType(org.credit_usage_type)

                // Fetch users for individual and role types
                if (org.credit_usage_type === "individual" || org.credit_usage_type === "role") {
                    const usersResult = await getOrganizationUsersClient()
                    if (usersResult.success && usersResult.data) {
                        // Filter out admin users from credit allocation
                        // Admins should not consume organizational credits
                        const nonAdminUsers = usersResult.data.filter(
                            user => user.role !== "ADMIN" && user.role !== "OWNER"
                        )
                        setUsers(nonAdminUsers)
                    }
                }
            } catch (err) {
                console.error("Failed to fetch organization:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handlePurchaseSuccess = async () => {
        // Refresh organization data after successful purchase
        try {
            const updated = await getOrganization()
            setOrganization(updated)
            setCreditUsageType(updated.credit_usage_type)
            setShowPurchaseModal(false)
        } catch (err) {
            console.error("Failed to refresh organization data:", err)
        }
    }

    const handleAllocationSuccess = async () => {
        // Refresh organization data after successful allocation
        try {
            const updated = await getOrganization()
            setOrganization(updated)
            setCreditUsageType(updated.credit_usage_type)

            // Also refresh users list to show updated credit balances
            if (updated.credit_usage_type === "individual" || updated.credit_usage_type === "role") {
                const usersResult = await getOrganizationUsersClient()
                if (usersResult.success && usersResult.data) {
                    // Filter out admin users from credit allocation
                    const nonAdminUsers = usersResult.data.filter(
                        user => user.role !== "ADMIN" && user.role !== "OWNER"
                    )
                    setUsers(nonAdminUsers)
                }
            }
        } catch (err) {
            console.error("Failed to refresh data after allocation:", err)
        }
    }

    const handleIndividualUserAllocation = (user: OrganizationUser) => {
        setSelectedUser(user)
        setShowIndividualUserModal(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading organization data...</p>
                </div>
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center bg-white rounded-xl p-8 shadow-sm border">
                    <div className="h-16 w-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-2">No organization found</p>
                    <p className="text-sm text-gray-500">Please create an organization first to manage credits</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Credit Management</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Monitor and manage organizational credit allocation across <b>{organization.name}</b>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Credit System:</span>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border">
                                {creditUsageType.charAt(0).toUpperCase() + creditUsageType.slice(1)}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowPurchaseModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                            <Plus size={16} />
                            Purchase Credits
                        </button>
                    </div>
                </div>

                {/* Pool View */}
                {creditUsageType === "pool" && (
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl p-8 text-white shadow-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Organization Pool</h3>
                                <p className="text-blue-100 opacity-90">
                                    Shared credits available for all team members
                                </p>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="bg-white/10 rounded-lg px-4 py-2">
                                        <span className="text-blue-100 text-sm">Pool Credits</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold mb-1">
                                    {organization?.credits?.toLocaleString() ?? 0}
                                </div>
                                <div className="text-blue-100 opacity-90">Credits Available</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Individual UI */}
                {creditUsageType === "individual" && (
                    <div className="space-y-6">
                        {/* Credits Left to Allocate */}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold">Credits Available for Allocation</h3>
                                    <p className="text-sm text-green-100">Ready to distribute to individual users</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {organization?.credits?.toLocaleString() ?? 0}
                                    </div>
                                    <div className="text-sm text-green-100">Credits Available</div>
                                </div>
                            </div>
                        </div>

                        {/* Current Individual Allocation */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Credits Allocated in Organisation
                                </h3>
                                <button
                                    onClick={() => setShowAllocationModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    Allocate Credits
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total credits allocated to all users:</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {users.reduce((total, user) => total + (user.credits || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Credits
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {(user.credits || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button
                                                        onClick={() => handleIndividualUserAllocation(user)}
                                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                        title="Allocate credits to this user">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role-based UI */}
                {creditUsageType === "role" && (
                    <div className="space-y-6">
                        {/* Credits Left to Allocate */}
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold">Credits Available for Allocation</h3>
                                    <p className="text-sm text-purple-100">Ready to distribute to roles</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {organization?.credits?.toLocaleString() ?? 0}
                                    </div>
                                    <div className="text-sm text-purple-100">Credits Available</div>
                                </div>
                            </div>
                        </div>

                        {/* Current Role Allocation */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Current Role Allocations</h3>
                                <button
                                    onClick={() => setShowAllocationModal(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    Allocate Credits
                                </button>
                            </div>

                            {/* Role breakdown */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-900">
                                        {users
                                            .filter(u => u.role.toLowerCase() === "doctor")
                                            .reduce((total, user) => total + (user.credits || 0), 0)
                                            .toLocaleString()}
                                    </div>
                                    <div className="text-sm text-purple-600">Doctor Credits</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-900">
                                        {users
                                            .filter(u => u.role.toLowerCase() === "radiologist")
                                            .reduce((total, user) => total + (user.credits || 0), 0)
                                            .toLocaleString()}
                                    </div>
                                    <div className="text-sm text-purple-600">Radiologist Credits</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-900">
                                        {users
                                            .filter(u => u.role.toLowerCase() === "pharmacy")
                                            .reduce((total, user) => total + (user.credits || 0), 0)
                                            .toLocaleString()}
                                    </div>
                                    <div className="text-sm text-purple-600">Pharmacy Credits</div>
                                </div>
                            </div>
                        </div>

                        {/* Users by Role Tabs */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900">Users by Role</h3>
                            </div>

                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                                    <button
                                        onClick={() => setSelectedRole("doctor")}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                            selectedRole === "doctor"
                                                ? "border-purple-500 text-purple-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}>
                                        Doctors ({users.filter(u => u.role.toLowerCase() === "doctor").length})
                                    </button>
                                    <button
                                        onClick={() => setSelectedRole("radiologist")}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                            selectedRole === "radiologist"
                                                ? "border-purple-500 text-purple-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}>
                                        Radiologists ({users.filter(u => u.role.toLowerCase() === "radiologist").length}
                                        )
                                    </button>
                                    <button
                                        onClick={() => setSelectedRole("pharmacy")}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                            selectedRole === "pharmacy"
                                                ? "border-purple-500 text-purple-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}>
                                        Pharmacy ({users.filter(u => u.role.toLowerCase() === "pharmacy").length})
                                    </button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Name
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Email
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Credits
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users
                                            .filter(u => u.role.toLowerCase() === selectedRole)
                                            .map(user => (
                                                <tr key={user.id}>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                        {(user.credits || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        <button
                                                            onClick={() => handleIndividualUserAllocation(user)}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                            title="Allocate credits to this user">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Credit Purchase Modal */}
                {showPurchaseModal && (
                    <CreditPurchaseModal
                        onClose={() => setShowPurchaseModal(false)}
                        onPurchaseSuccess={handlePurchaseSuccess}
                        creditUsageType={creditUsageType}
                    />
                )}

                {/* Credit Allocation Modal */}
                {showAllocationModal && (creditUsageType === "individual" || creditUsageType === "role") && (
                    <CreditAllocationModal
                        onClose={() => setShowAllocationModal(false)}
                        onAllocationSuccess={handleAllocationSuccess}
                        creditUsageType={creditUsageType}
                        availableCredits={(organization?.credits as number) || 0}
                    />
                )}

                {/* Individual User Allocation Modal */}
                {showIndividualUserModal && selectedUser && (
                    <IndividualUserAllocationModal
                        onClose={() => setShowIndividualUserModal(false)}
                        onAllocationSuccess={handleAllocationSuccess}
                        user={selectedUser}
                        availableCredits={(organization?.credits as number) || 0}
                    />
                )}
            </div>
        </div>
    )
}

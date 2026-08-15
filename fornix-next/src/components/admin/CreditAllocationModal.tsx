"use client"

import React, { useState, useEffect } from "react"
import { X, Users, UserCheck, Plus, Minus } from "lucide-react"
import { getOrganizationUsersClient, OrganizationUser } from "@/services/admin/organization.service"
import { allocateCreditsToUser } from "@/services/organization/credit.service"

interface CreditAllocationModalProps {
    onClose: () => void
    onAllocationSuccess: () => void
    creditUsageType: "individual" | "role"
    availableCredits: number
}

export default function CreditAllocationModal({
    onClose,
    onAllocationSuccess,
    creditUsageType,
    availableCredits
}: CreditAllocationModalProps) {
    const [users, setUsers] = useState<OrganizationUser[]>([])
    const [loading, setLoading] = useState(true)
    const [allocating, setAllocating] = useState(false)
    const [selectedRole, setSelectedRole] = useState<"doctor" | "radiologist" | "pharmacy">("doctor")
    const [allocationAmount, setAllocationAmount] = useState<number>(0)

    console.log("MODAL RENDERED - Users count:", users.length, "Loading:", loading)

    // Group users by role
    const usersByRole = {
        doctor: users.filter(user => user.role.toLowerCase() === "doctor"),
        radiologist: users.filter(user => user.role.toLowerCase() === "radiologist"),
        pharmacy: users.filter(user => user.role.toLowerCase() === "pharmacy")
    }

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true)
                console.log("Fetching organization users...")
                const result = await getOrganizationUsersClient()
                console.log("Users fetch result:", result)
                if (result.success && result.data) {
                    // Filter out admin users from credit allocation
                    // Admins should not consume organizational credits
                    const nonAdminUsers = result.data.filter(user => user.role !== "ADMIN" && user.role !== "OWNER")
                    setUsers(nonAdminUsers)
                    console.log("Users set:", nonAdminUsers)
                } else {
                    console.error("Failed to fetch users:", result.error)
                }
            } catch (error) {
                console.error("Failed to fetch users:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    const handleIndividualAllocation = async () => {
        if (allocationAmount <= 0 || allocationAmount > availableCredits) return

        setAllocating(true)
        try {
            // Update each user's credits using the new allocation endpoint
            const updatePromises = users.map(user =>
                allocateCreditsToUser({
                    user_id: user.id,
                    credits: allocationAmount,
                    allocate: true
                })
            )
            await Promise.all(updatePromises)

            console.log(`Allocated ${allocationAmount} credits to ${users.length} users`)

            onAllocationSuccess()
            onClose()
        } catch (error) {
            console.error("Failed to allocate credits:", error)
        } finally {
            setAllocating(false)
        }
    }

    const handleRoleAllocation = async () => {
        if (allocationAmount <= 0 || allocationAmount > availableCredits) return

        const roleUsers = usersByRole[selectedRole]
        if (roleUsers.length === 0) return

        setAllocating(true)
        try {
            // Update each user in the selected role using the new allocation endpoint
            const updatePromises = roleUsers.map(user =>
                allocateCreditsToUser({
                    user_id: user.id,
                    credits: allocationAmount,
                    allocate: true
                })
            )
            await Promise.all(updatePromises)

            console.log(`Allocated ${allocationAmount} credits to ${roleUsers.length} ${selectedRole}s`)

            onAllocationSuccess()
            onClose()
        } catch (error) {
            console.error("Failed to allocate credits:", error)
        } finally {
            setAllocating(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Loading users...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
                {/* Header */}
                <div
                    className={`p-6 text-white ${creditUsageType === "individual" ? "bg-green-600" : "bg-purple-600"}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">
                                {creditUsageType === "individual"
                                    ? "Allocate Credits to Users"
                                    : "Allocate Credits to Roles"}
                            </h2>
                            <p className="text-sm opacity-90">
                                Available: {availableCredits.toLocaleString()} credits | Users: {users.length}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-black hover:bg-opacity-20 rounded p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 overflow-y-auto" style={{ maxHeight: "calc(90vh - 150px)" }}>
                    {creditUsageType === "individual" ? (
                        /* Individual Allocation */
                        <div className="space-y-6">
                            {/* Allocation Input */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Credits</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Credits per user
                                        </label>
                                        <input
                                            type="number"
                                            value={allocationAmount}
                                            onChange={e => setAllocationAmount(parseInt(e.target.value) || 0)}
                                            min="0"
                                            max={availableCredits}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter credits to allocate"
                                        />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <div>Total users: {users.length}</div>
                                        <div>
                                            Total cost: {(allocationAmount * users.length).toLocaleString()} credits
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Users ({users.length})</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Current Credits
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    After Allocation
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                        No users found in organization
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.map(user => (
                                                    <tr key={user.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <UserCheck size={16} className="text-green-600" />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {user.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {user.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {(user.credits || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                            {allocationAmount.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Role Allocation */
                        <div className="space-y-6">
                            {/* Role Selection and Allocation Input */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Credits to Role</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Role
                                        </label>
                                        <select
                                            value={selectedRole}
                                            onChange={e =>
                                                setSelectedRole(e.target.value as "doctor" | "radiologist" | "pharmacy")
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                            <option value="doctor">Doctor ({usersByRole.doctor.length} users)</option>
                                            <option value="radiologist">
                                                Radiologist ({usersByRole.radiologist.length} users)
                                            </option>
                                            <option value="pharmacy">
                                                Pharmacy ({usersByRole.pharmacy.length} users)
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Credits per user
                                        </label>
                                        <input
                                            type="number"
                                            value={allocationAmount}
                                            onChange={e => setAllocationAmount(parseInt(e.target.value) || 0)}
                                            min="0"
                                            max={availableCredits}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter credits to allocate"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-gray-600">
                                    <div>
                                        Selected role: <span className="font-semibold capitalize">{selectedRole}</span>
                                    </div>
                                    <div>Users in role: {usersByRole[selectedRole].length}</div>
                                    <div>
                                        Total cost:{" "}
                                        {(allocationAmount * usersByRole[selectedRole].length).toLocaleString()} credits
                                    </div>
                                </div>
                            </div>

                            {/* Users in Selected Role */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                        {selectedRole}s ({usersByRole[selectedRole].length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Current Credits
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    After Allocation
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {usersByRole[selectedRole].length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                        No {selectedRole}s found in organization
                                                    </td>
                                                </tr>
                                            ) : (
                                                usersByRole[selectedRole].map(user => (
                                                    <tr key={user.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                                    <Users size={16} className="text-purple-600" />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {user.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {user.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {(user.credits || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                                                            {allocationAmount.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={
                                creditUsageType === "individual" ? handleIndividualAllocation : handleRoleAllocation
                            }
                            disabled={allocationAmount <= 0 || allocationAmount > availableCredits || allocating}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                                creditUsageType === "individual"
                                    ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                                    : "bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
                            }`}>
                            {allocating ? "Allocating..." : "Allocate Credits"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

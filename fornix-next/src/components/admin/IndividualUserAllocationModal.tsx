"use client"

import React, { useState } from "react"
import { X, User } from "lucide-react"
import { OrganizationUser } from "@/services/admin/organization.service"
import { allocateCreditsToUser } from "@/services/organization/credit.service"

interface IndividualUserAllocationModalProps {
    onClose: () => void
    onAllocationSuccess: () => void
    user: OrganizationUser
    availableCredits: number
}

export default function IndividualUserAllocationModal({
    onClose,
    onAllocationSuccess,
    user,
    availableCredits
}: IndividualUserAllocationModalProps) {
    const [allocationAmount, setAllocationAmount] = useState<number>(0)
    const [allocating, setAllocating] = useState(false)

    const handleAllocation = async () => {
        if (allocationAmount <= 0 || allocationAmount > availableCredits) return

        setAllocating(true)
        try {
            // Allocate credits to user via backend
            await allocateCreditsToUser({ user_id: user.id, credits: allocationAmount, allocate: true })

            console.log(`Allocated ${allocationAmount} credits to ${user.name}`)

            onAllocationSuccess()
            onClose()
        } catch (error) {
            console.error("Failed to allocate credits:", error)
            alert("Failed to allocate credits. Please try again.")
        } finally {
            setAllocating(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Allocate Credits to User</h2>
                            <p className="text-sm text-blue-100">Set credits for {user.name}</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-blue-500 rounded p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center text-sm">
                            <span className="text-gray-600">Current Credits:</span>
                            <span className="font-semibold text-gray-900">{(user.credits || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Allocation Input */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Credits to allocate</label>
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

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-blue-700">Available in pool:</span>
                                <span className="font-semibold text-blue-900">{availableCredits.toLocaleString()}</span>
                            </div>
                        </div>

                        {allocationAmount > availableCredits && (
                            <p className="text-red-500 text-sm">Cannot allocate more credits than available in pool.</p>
                        )}

                        {allocationAmount > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="text-sm text-gray-700">
                                    <div className="flex justify-between">
                                        <span>Current credits:</span>
                                        <span>{(user.credits || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>After allocation:</span>
                                        <span className="font-semibold text-green-600">
                                            {allocationAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleAllocation}
                        disabled={allocationAmount <= 0 || allocationAmount > availableCredits || allocating}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400">
                        {allocating ? "Allocating..." : "Allocate Credits"}
                    </button>
                </div>
            </div>
        </div>
    )
}

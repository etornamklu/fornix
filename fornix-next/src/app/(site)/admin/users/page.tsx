"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Trash2 } from "lucide-react"
import { parseRole } from "@/utils/dashboard/role"
import {
    sendOrganizationInvitations,
    getOrganizationUsersClient,
    deleteOrganizationUser,
    OrganizationUser
} from "@/services/admin/organization.service"

type StaffMember = {
    id: string
    name: string
    email: string
    role: string
    status?: "ACTIVE" | "INVITED" | "INACTIVE" | "PENDING" | "ACCEPTED"
}

export default function AdminUsersPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [showInvite, setShowInvite] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
    const [resultModal, setResultModal] = useState<{
        open: boolean
        title: string
        message: string
        isError?: boolean
    }>({ open: false, title: "", message: "", isError: false })
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
        open: boolean
        user: StaffMember | null
    }>({ open: false, user: null })
    const [isDeleting, setIsDeleting] = useState(false)
    const [invites, setInvites] = useState<{ name: string; email: string; role: string }[]>([
        { name: "", email: "", role: "" }
    ])
    const [touchedFields, setTouchedFields] = useState<{
        [key: number]: { name?: boolean; email?: boolean; role?: boolean }
    }>({})

    const updateInviteField = (index: number, field: "name" | "email" | "role", value: string) => {
        setInvites(prev => {
            const clone = [...prev]
            clone[index] = { ...clone[index], [field]: value }
            return clone
        })

        // Mark field as touched only if all fields in this row are filled
        const currentInvite = { ...invites[index], [field]: value }
        const allFieldsFilled = currentInvite.name.trim() && currentInvite.email.trim() && currentInvite.role.trim()

        if (allFieldsFilled) {
            setTouchedFields(prev => ({
                ...prev,
                [index]: { name: true, email: true, role: true }
            }))
        }
    }

    const addInviteRow = () => setInvites(prev => [...prev, { name: "", email: "", role: "" }])
    const removeInviteRow = (index: number) => setInvites(prev => prev.filter((_, i) => i !== index))

    const resetForm = () => {
        setInvites([{ name: "", email: "", role: "" }])
        setTouchedFields({})
    }

    // Simple validation
    const validateInvites = () => {
        const errors: { [key: number]: { name?: string; email?: string; role?: string } } = {}
        const emails = new Set<string>()

        invites.forEach((invite, index) => {
            // Name: at least first and last name
            const nameParts = invite.name
                .trim()
                .split(" ")
                .filter(part => part.length > 0)
            if (nameParts.length < 2) {
                errors[index] = { ...errors[index], name: "Enter first and last name" }
            }

            // Email: basic validation + duplicate check
            if (!invite.email.trim()) {
                errors[index] = { ...errors[index], email: "Email is required" }
            } else if (!invite.email.includes("@") || !invite.email.includes(".")) {
                errors[index] = { ...errors[index], email: "Invalid email format" }
            } else if (emails.has(invite.email.toLowerCase())) {
                errors[index] = { ...errors[index], email: "Duplicate email" }
            } else {
                emails.add(invite.email.toLowerCase())
            }

            // Role: required
            if (!invite.role.trim()) {
                errors[index] = { ...errors[index], role: "Role is required" }
            }
        })

        return { errors, isValid: Object.keys(errors).length === 0 }
    }

    const getValidationResult = validateInvites()
    const canSubmit = invites.length > 0 && getValidationResult.isValid

    const handleSubmitInvites = async () => {
        // Mark all fields as touched to show errors on submit attempt
        const allTouched: { [key: number]: { name: boolean; email: boolean; role: boolean } } = {}
        invites.forEach((_, index) => {
            allTouched[index] = { name: true, email: true, role: true }
        })
        setTouchedFields(allTouched)

        const validationResult = validateInvites()
        if (!validationResult.isValid) {
            return
        }
        setIsSubmitting(true)
        try {
            const result = await sendOrganizationInvitations(invites)
            if (result.success) {
                // Optimistically append invited entries
                setStaff(prev => [
                    ...prev,
                    ...invites.map((i, index) => ({
                        id: `temp-${Date.now()}-${index}`, // Temporary ID for optimistic update
                        name: i.name,
                        email: i.email,
                        role: i.role,
                        status: "PENDING" as const
                    }))
                ])
                setResultModal({
                    open: true,
                    title: "Invitations Sent",
                    message: "Your invitations have been sent successfully.",
                    isError: false
                })
                resetForm()
                setShowInvite(false)
                // Reconcile with backend
                await loadUsers()
            } else {
                console.error("Invitation API returned error:", result)
                setResultModal({
                    open: true,
                    title: "Failed to Send",
                    message: result.error || "Failed to send invitations",
                    isError: true
                })
            }
        } catch (e) {
            console.error("Unexpected error sending invitations:", e)
            setResultModal({
                open: true,
                title: "Unexpected Error",
                message: "Unexpected error sending invitations",
                isError: true
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const loadUsers = useCallback(async () => {
        const result = await getOrganizationUsersClient()
        if (result.success && Array.isArray(result.data)) {
            const mapped: StaffMember[] = result.data.map((u: OrganizationUser) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role || "",
                status: u.logged_in ? "ACCEPTED" : "PENDING"
            }))
            setStaff(mapped)
        } else {
            console.error("Failed to load organization users:", result.error)
        }
    }, [])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    const handleDeleteUser = async (user: StaffMember) => {
        setIsDeleting(true)
        try {
            const result = await deleteOrganizationUser(user.id)
            setDeleteConfirmModal({ open: false, user: null }) // Close confirmation modal

            if (result.success) {
                setResultModal({
                    open: true,
                    title: "User Removed",
                    message: `${user.name} has been successfully removed from the organization.`,
                    isError: false
                })
                loadUsers()
            } else {
                // Parse the error message to make it user-friendly
                let errorMessage = "Failed to remove user"
                if (result.error) {
                    try {
                        const errorData = JSON.parse(result.error)
                        if (errorData.detail && Array.isArray(errorData.detail)) {
                            errorMessage = errorData.detail[0]?.msg || errorMessage
                        } else if (errorData.detail) {
                            errorMessage = errorData.detail
                        }
                    } catch {
                        errorMessage = result.error
                    }
                }
                setResultModal({
                    open: true,
                    title: "Error",
                    message: errorMessage,
                    isError: true
                })
            }
        } catch (error) {
            setDeleteConfirmModal({ open: false, user: null }) // Ensure modal is closed on error
            setResultModal({
                open: true,
                title: "Error",
                message: "An unexpected error occurred while removing the user. Please try again.",
                isError: true
            })
        } finally {
            setIsDeleting(false) // Reset loading state
        }
    }

    // Close any open row menu when clicking anywhere else; ignore clicks inside the open row's menu wrapper
    useEffect(() => {
        const handleDocClick = (e: MouseEvent) => {
            if (openMenuIndex === null) return
            const wrapper = document.querySelector(`[data-menu-index="${openMenuIndex}"]`)
            if (wrapper && e.target && wrapper.contains(e.target as Node)) {
                return
            }
            console.log("[Users] document click -> closing any open menu")
            setOpenMenuIndex(null)
        }
        document.addEventListener("click", handleDocClick)
        return () => document.removeEventListener("click", handleDocClick)
    }, [openMenuIndex])

    // (single handler above is enough)

    const visibleStaff = staff.filter(u => u.role !== "ADMIN" && u.role !== "OWNER")

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <button
                        onClick={() => {
                            resetForm()
                            setShowInvite(true)
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <span className="text-lg leading-none">+</span>
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                <div className="p-6">
                    <div className="overflow-x-auto overflow-y-visible border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {visibleStaff.map((s, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">
                                                {parseRole(s.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {s.status === "ACCEPTED"
                                                ? "Accepted"
                                                : s.status === "PENDING"
                                                  ? "Pending"
                                                  : "Unknown"}
                                        </td>
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm text-right overflow-visible"
                                            onClick={e => e.stopPropagation()}>
                                            <div className="relative inline-block text-left" data-menu-index={idx}>
                                                <button
                                                    className="p-1 rounded hover:bg-gray-100"
                                                    onMouseDown={e => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        // @ts-ignore
                                                        if (
                                                            e.nativeEvent &&
                                                            typeof e.nativeEvent.stopImmediatePropagation === "function"
                                                        ) {
                                                            // Ensure the document mousedown handler doesn't run after this
                                                            // @ts-ignore
                                                            e.nativeEvent.stopImmediatePropagation()
                                                        }
                                                        const next = openMenuIndex === idx ? null : idx
                                                        console.log("[Users] menu toggle mousedown", {
                                                            idx,
                                                            openMenuIndex,
                                                            next
                                                        })
                                                        setOpenMenuIndex(next)
                                                    }}
                                                    aria-haspopup="true"
                                                    aria-expanded={openMenuIndex === idx}
                                                    title="Actions">
                                                    ⋯
                                                </button>
                                                <div
                                                    onMouseDown={e => {
                                                        e.stopPropagation()
                                                        // @ts-ignore
                                                        if (
                                                            e.nativeEvent &&
                                                            typeof e.nativeEvent.stopImmediatePropagation === "function"
                                                        ) {
                                                            // Prevent document mousedown from firing when interacting inside menu
                                                            // @ts-ignore
                                                            e.nativeEvent.stopImmediatePropagation()
                                                        }
                                                    }}
                                                className={`${openMenuIndex === idx ? "block" : "hidden"} absolute right-0 ${idx >= visibleStaff.length - 2 ? "bottom-full mb-2" : "top-full mt-2"} w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}>
                                                    <button
                                                        type="button"
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                                                            s.role === "ADMIN" || s.role === "OWNER"
                                                                ? "text-gray-400 cursor-not-allowed"
                                                                : "text-red-600 hover:bg-red-50"
                                                        }`}
                                                        onClick={() => {
                                                            if (s.role === "ADMIN" || s.role === "OWNER") {
                                                                return // Do nothing for admin users
                                                            }
                                                            console.log("[Users] delete clicked for", s)
                                                            setDeleteConfirmModal({ open: true, user: s })
                                                            setOpenMenuIndex(null)
                                                        }}
                                                        disabled={s.role === "ADMIN" || s.role === "OWNER"}>
                                                        <Trash2 className="w-4 h-4" />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showInvite && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Invite users</h2>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                    resetForm()
                                    setShowInvite(false)
                                }}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {invites.map((inv, i) => (
                                <div key={i} className="border border-gray-200 rounded-lg p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={inv.name}
                                                onChange={e => updateInviteField(i, "name", e.target.value)}
                                                placeholder="John Doe"
                                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                    getValidationResult.errors[i]?.name && touchedFields[i]?.name
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                            />
                                            {getValidationResult.errors[i]?.name && touchedFields[i]?.name && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {getValidationResult.errors[i].name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={inv.email}
                                                onChange={e => updateInviteField(i, "email", e.target.value)}
                                                placeholder="user@example.com"
                                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                    getValidationResult.errors[i]?.email && touchedFields[i]?.email
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                            />
                                            {getValidationResult.errors[i]?.email && touchedFields[i]?.email && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {getValidationResult.errors[i].email}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                            <select
                                                value={inv.role}
                                                onChange={e => updateInviteField(i, "role", e.target.value)}
                                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                    getValidationResult.errors[i]?.role && touchedFields[i]?.role
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}>
                                                <option value="">Select role</option>
                                                <option value="DOCTOR">Doctor</option>
                                                <option value="RADIOLOGIST">Radiologist</option>
                                                <option value="PHARMACY">Pharmacist</option>
                                            </select>
                                            {getValidationResult.errors[i]?.role && touchedFields[i]?.role && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {getValidationResult.errors[i].role}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {invites.length > 1 && (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => removeInviteRow(i)}
                                                className="text-sm text-red-600 hover:text-red-800 hover:underline">
                                                Remove this user
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-between items-center pt-4 border-t">
                                <button
                                    onClick={addInviteRow}
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    Add another user
                                </button>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            resetForm()
                                            setShowInvite(false)
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitInvites}
                                        disabled={!canSubmit || isSubmitting}
                                        className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {isSubmitting ? "Sending..." : "Send invites"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {resultModal.open && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-sm rounded-lg shadow-lg">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2
                                className={`text-lg font-semibold ${resultModal.isError ? "text-red-600" : "text-blue-700"}`}>
                                {resultModal.title}
                            </h2>
                            <button
                                className="text-gray-500"
                                onClick={() => setResultModal({ open: false, title: "", message: "", isError: false })}>
                                Close
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-700">{resultModal.message}</p>
                        </div>
                        <div className="p-4 pt-0 flex justify-end">
                            <button
                                onClick={() => setResultModal({ open: false, title: "", message: "", isError: false })}
                                className={`px-4 py-2 rounded-lg text-white ${resultModal.isError ? "bg-red-600" : "bg-blue-600"}`}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal.open && deleteConfirmModal.user && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-red-600">Confirm Removal</h2>
                            <button
                                className="text-gray-500"
                                onClick={() => {
                                    setDeleteConfirmModal({ open: false, user: null })
                                    setIsDeleting(false)
                                }}>
                                ×
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-700">
                                Are you sure you want to remove <strong>{deleteConfirmModal.user.name}</strong> from the
                                organization?
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                This action cannot be undone. The user will lose access to the organization immediately.
                            </p>
                        </div>
                        <div className="p-4 pt-0 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmModal({ open: false, user: null })}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteConfirmModal.user!)}
                                disabled={isDeleting}
                                className="relative px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className={`whitespace-nowrap ${isDeleting ? "opacity-0" : "opacity-100"}`}>
                                    Remove User
                                </span>
                                {isDeleting && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

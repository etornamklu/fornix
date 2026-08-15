import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { getDoctorData } from "@/services/auth/auth.service"
import { signOut } from "next-auth/react"
import {
    CreateOrganizationRequest,
    Organization,
    UpdateOrganizationRequest,
    OrganizationInvitation
} from "@/utils/types"

export const createOrganization = async (
    organizationData: CreateOrganizationRequest
): Promise<{ success: boolean; data?: Organization; error?: string }> => {
    try {
        const url = `/api/organization`

        console.log("Creating organization with data:", organizationData)

        // Get auth data to check user role
        const doctor = await getDoctorData()
        if (doctor && doctor.value) {
            const authData = JSON.parse(doctor.value)
            console.log("User auth data:", authData)
            console.log("User role:", authData.role)
            console.log("User ID:", authData.id)
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(organizationData)
        })

        if (response.status === 200 || response.status === 201) {
            const createdOrganization = await response.json()
            console.log("Backend response:", createdOrganization)
            return { success: true, data: createdOrganization }
        }

        if (response.status >= 400 && response.status < 500) {
            return { success: false, error: `Request failed: ${response.status} ${response.statusText}` }
        }

        if (response.status >= 500) {
            return { success: false, error: "Server error. Please try again later." }
        }

        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error creating organization:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const getOrganizations = async (): Promise<{ success: boolean; data?: Organization; error?: string }> => {
    try {
        const url = `${BACKEND_BASE_URL}/organization`
        const token = await getBearerToken()

        if (!token) {
            signOut()
            return { success: false, error: "No authentication token available" }
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.status === 200) {
            const organizations = await response.json()
            return { success: true, data: organizations }
        }

        if (response.status === 401) {
            try {
                const freshToken = await getBearerToken()
                if (!freshToken) {
                    signOut()
                    return { success: false, error: "Authentication expired. Please sign in again." }
                }

                const retryResponse = await fetch(url, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${freshToken}`
                    }
                })

                if (retryResponse.status === 200) {
                    const organizations = await retryResponse.json()
                    return { success: true, data: organizations }
                } else if (retryResponse.status === 401) {
                    return {
                        success: false,
                        error: "Access denied. You may not have permission to view organizations."
                    }
                }
            } catch (retryError) {
                signOut()
                return { success: false, error: "Authentication failed. Please sign in again." }
            }
        }

        return { success: false, error: `Failed to fetch organizations: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching organizations:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const getOrganizationById = async (
    id: string
): Promise<{ success: boolean; data?: Organization; error?: string }> => {
    try {
        const url = `${BACKEND_BASE_URL}/organization/${id}`
        const token = await getBearerToken()

        if (!token) {
            signOut()
            return { success: false, error: "No authentication token available" }
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.status === 200) {
            const organization = await response.json()
            return { success: true, data: organization }
        }

        if (response.status === 401) {
            try {
                const freshToken = await getBearerToken()
                if (!freshToken) {
                    signOut()
                    return { success: false, error: "Authentication expired. Please sign in again." }
                }

                const retryResponse = await fetch(url, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${freshToken}`
                    }
                })

                if (retryResponse.status === 200) {
                    const organization = await retryResponse.json()
                    return { success: true, data: organization }
                } else if (retryResponse.status === 401) {
                    return {
                        success: false,
                        error: "Access denied. You may not have permission to view this organization."
                    }
                }
            } catch (retryError) {
                signOut()
                return { success: false, error: "Authentication failed. Please sign in again." }
            }
        }

        return { success: false, error: `Failed to fetch organization: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching organization:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const getImageUrl = (imageId: string): string => {
    return `/api/image/${imageId}`
}

export const uploadImage = async (file: File): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
        const url = `${BACKEND_BASE_URL}/image`
        const token = await getBearerToken()

        if (!token) {
            signOut()
            return { success: false, error: "No authentication token available" }
        }

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        })

        if (response.status === 200 || response.status === 201) {
            const result = await response.json()
            console.log("Upload response:", result)
            return { success: true, data: result.id || result.image_id || result }
        }

        if (response.status === 401) {
            try {
                const freshToken = await getBearerToken()
                if (!freshToken) {
                    signOut()
                    return { success: false, error: "Authentication expired. Please sign in again." }
                }

                const retryResponse = await fetch(url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${freshToken}`
                    },
                    body: formData
                })

                if (retryResponse.status === 201) {
                    const result = await retryResponse.json()
                    return { success: true, data: result.id || result.image_id || result }
                } else if (retryResponse.status === 401) {
                    return {
                        success: false,
                        error: "Access denied. You may not have permission to upload images."
                    }
                }
            } catch (retryError) {
                signOut()
                return { success: false, error: "Authentication failed. Please sign in again." }
            }
        }

        return { success: false, error: `Failed to upload image: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error uploading image:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const sendOrganizationInvitations = async (
    invites: OrganizationInvitation[]
): Promise<{ success: boolean; error?: string }> => {
    try {
        const url = `/api/organization/invitations`

        console.log("Sending organization invitations payload:", invites)

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invites)
        })

        console.log("Invitation API response status:", response.status, response.statusText)

        if (response.status === 200 || response.status === 201) {
            return { success: true }
        }

        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }

        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }

        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error sending invitations:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const getOrganizationByIdClient = async (
    id: string
): Promise<{ success: boolean; data?: Organization; error?: string }> => {
    try {
        const response = await fetch(`/api/organization/${id}`, {
            method: "GET"
        })

        if (response.status === 200) {
            const org = await response.json()
            return { success: true, data: org }
        }

        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }

        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }

        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching organization by id (client):", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const getCurrentOrganizationClient = async (): Promise<{
    success: boolean
    data?: Organization
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization`, { method: "GET" })
        if (response.status === 200) {
            const org = await response.json()
            return { success: true, data: org }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching current organization (client):", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export type OrganizationUser = {
    id: string
    name: string
    email: string
    role: string
    user_code: string
    organization_id?: string
    free_trial?: boolean
    logged_in?: boolean
    credits?: number
    profile_picture_url?: string | null
}

export const getOrganizationUsersClient = async (): Promise<{
    success: boolean
    data?: OrganizationUser[]
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization/users`, { method: "GET" })
        if (response.status === 200) {
            const users = await response.json()
            return { success: true, data: users as OrganizationUser[] }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching organization users (client):", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const deleteOrganizationUser = async (
    userId: string
): Promise<{
    success: boolean
    error?: string
}> => {
    try {
        console.log("Deleting organization user:", userId)
        const response = await fetch(`/api/organization/users/${userId}`, {
            method: "DELETE"
        })
        console.log("Delete user API response status:", response.status, response.statusText)

        if (response.status === 200 || response.status === 204) {
            return { success: true }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error deleting organization user:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const updateUserCredits = async (
    userId: string,
    credits: number
): Promise<{
    success: boolean
    data?: OrganizationUser
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization/users/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ credits })
        })

        if (response.status === 200) {
            const updatedUser = await response.json()
            return { success: true, data: updatedUser }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error updating user credits:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

// NEW API FUNCTIONS FOR DASHBOARD

export const getTotalPatientsCount = async (): Promise<{
    success: boolean
    data?: number
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization/users/count?role=PATIENT`, { method: "GET" })
        if (response.status === 200) {
            const count = await response.json()
            return { success: true, data: count }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching total patients count:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export const getLast30DaysPatientsCount = async (): Promise<{
    success: boolean
    data?: number
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization/users/count?role=PATIENT&last_month=true`, { method: "GET" })
        if (response.status === 200) {
            const count = await response.json()
            return { success: true, data: count }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching last 30 days patients count:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export type MonthlyPatientCount = {
    month: string
    count: number
}

export const getYearlyPatientsCount = async (
    year: string
): Promise<{
    success: boolean
    data?: MonthlyPatientCount[]
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization/users/count?role=PATIENT&year=${year}`, { method: "GET" })
        if (response.status === 200) {
            const data = await response.json()
            return { success: true, data }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching yearly patients count:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

export type DoctorPatient = {
    patient_id: string
    patient_name: string
    patient_email: string
    doctor_id: string
    doctor_name: string
    doctor_role: string
    last_visit?: string
    next_visit?: string
    department?: string
    status?: string
}

export const getDoctorPatients = async (
    limit: number = 100
): Promise<{
    success: boolean
    data?: DoctorPatient[]
    error?: string
}> => {
    try {
        const response = await fetch(`/api/organization/doc-patient?limit=${limit}`, { method: "GET" })
        if (response.status === 200) {
            const data = await response.json()
            return { success: true, data }
        }
        if (response.status >= 400 && response.status < 500) {
            let errorText = await response.text().catch(() => "")
            if (!errorText) errorText = `${response.status} ${response.statusText}`
            return { success: false, error: `Request failed: ${errorText}` }
        }
        if (response.status >= 500) {
            let errorText = await response.text().catch(() => "")
            return { success: false, error: errorText || "Server error. Please try again later." }
        }
        return { success: false, error: `Unexpected response: ${response.status} ${response.statusText}` }
    } catch (error) {
        console.error("Error fetching doctor-patient connections:", error)
        return { success: false, error: "Network error. Please check your connection and try again." }
    }
}

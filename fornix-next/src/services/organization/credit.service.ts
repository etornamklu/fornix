import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { signOut } from "next-auth/react"
import { Organization } from "@/utils/types"

// Get organization (backend gets it from token, no ID needed)
export const getOrganization = async (): Promise<Organization> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/organization`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        }
    })

    if (!response.ok) {
        if (response.status === 401) {
            signOut()
        }
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
}

// Update organization (PATCH)
export const updateOrganization = async (updates: Partial<Organization>): Promise<Organization> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/organization`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
    })

    if (!response.ok) {
        if (response.status === 401) {
            signOut()
        }
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
}

// Allocate credits by role (bulk allocation)
export const allocateCreditsByRole = async (payload: {
    role_credit: { doctor: number; radiologist: number; pharmacy: number }
    user: number
}) => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/organization/credits/allocate`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        if (response.status === 401) {
            signOut()
        }
        const text = await response.text().catch(() => "")
        throw new Error(text || `HTTP error! status: ${response.status}`)
    }

    return response.json()
}

// Allocate credits to a specific user (individual allocation)
export const allocateCreditsToUser = async (params: { user_id: string; credits: number; allocate?: boolean }) => {
    const bearerToken = await getBearerToken()
    const url = new URL(`${BACKEND_BASE_URL}/organization/credits`)
    url.searchParams.set("user_id", params.user_id)
    url.searchParams.set("credits", String(params.credits))
    url.searchParams.set("allocate", String(params.allocate ?? true))

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    if (!response.ok) {
        if (response.status === 401) {
            signOut()
        }
        const text = await response.text().catch(() => "")
        throw new Error(text || `HTTP error! status: ${response.status}`)
    }

    return response.json()
}

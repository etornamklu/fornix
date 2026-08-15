import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { updateUserCredits } from "@/utils/dashboard/credit"
import { signOut } from "next-auth/react"
import { RenameChatSessionRequest, RenameChatSessionResponse } from "@/utils/types"

export const getPatientThreadIds = async (patientId: string | null) => {
    const url = `${BACKEND_BASE_URL}/patient/threads/${patientId}`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`,
            "Content-Type": "application/json"
        }
    })

    const credits = response.headers.get("x-credits") ?? ""
    await updateUserCredits(credits)

    if (response.status === 401) signOut()

    const result = await response.json()

    return response.status === 200 ? result : []
}

export const getDoctorMedFindThreads = async () => {
    const url = `${BACKEND_BASE_URL}/doctor/threads`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (response.status === 401) signOut()

    const result = await response.json()

    return response.status === 200 ? result : []
}

export const getPatientMedFindThreads = async () => {
    const url = `${BACKEND_BASE_URL}/patient/medfind/threads`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (response.status === 401) signOut()

    const result = await response.json()

    return response.status === 200 ? result : []
}

export const getMedFindThreadData = async (sessionId: string) => {
    const url = `${BACKEND_BASE_URL}/doctor/chat-history/${sessionId}`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (response.status === 401) signOut()

    const result = await response.json()

    return response.status === 200 ? result : []
}

export const getPatientMedFindData = async (sessionId: string) => {
    const url = `${BACKEND_BASE_URL}/patient/medfind/chat-history/${sessionId}`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (response.status === 401) signOut()
    console.log("History Response:", response)

    const result = await response.json()
    console.log("History Fetched data:", result)

    return response.status === 200 ? result : []
}

export const renameChatSession = async (threadsId: string, newName: string): Promise<RenameChatSessionResponse> => {
    const url = `${BACKEND_BASE_URL}/patient/medfind/chat-history/${threadsId}`

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newName })
    })

    if (response.status === 401) signOut()

    const result = await response.json()

    return response.status === 200 ? result : { success: false }
}

export const renameDoctorChatSession = async (
    threadId: string,
    newName: string
): Promise<RenameChatSessionResponse> => {
    const url = `${BACKEND_BASE_URL}/doctor/chat-history/${threadId}`

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newName })
    })

    if (response.status === 401) signOut()

    const result = await response.json()

    return response.status === 200 ? result : { success: false }
}

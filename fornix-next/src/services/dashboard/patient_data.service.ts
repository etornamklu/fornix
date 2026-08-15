import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { signOut } from "next-auth/react"
import { fetchEventSource } from "@microsoft/fetch-event-source"

export const getPatientData = async (patientId?: string) => {
    // Simplified URL construction
    const url = patientId
        ? `${BACKEND_BASE_URL}/patient/patient-data/${patientId}/`
        : `${BACKEND_BASE_URL}/patient/patient-data`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`,
            "Content-Type": "application/json"
        }
    })

    if (response.status === 401) signOut()

    const result = await response.json()
    console.log(result)

    return response.status === 200 ? result.data : {}
}

export const getNarrativePatientData = async (
    patientId: string,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void
) => {
    const url = `${BACKEND_BASE_URL}/patient/patient-data/${patientId}/narrative`
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken

    const controller = new AbortController()
    const signal = controller.signal

    console.log("Connecting to narrative stream")

    await fetchEventSource(url, {
        signal: signal,
        method: "GET",
        headers: {
            Authorization: bearer,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            if (response.ok && response.status === 200) {
                // Connection successfully opened.
                console.log("Narrative Connection opened", response)
            } else if (response.status === 401) {
                signOut()
                onResponseError()
                controller.abort("auth")
            } else {
                onResponseError()
                controller.abort("other")
            }
            return Promise.resolve()
        },
        onmessage(event) {
            if (!event.data.includes('{"tok')) message += event.data
            onMessage(message)
            // console.log(message)
        },
        onerror() {
            console.error("Narrative Connection encountered an error")
            message = ""
            controller.abort()
            onResponseError()
            return
        },
        onclose() {
            console.log("Narrative Connection closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { signOut } from "next-auth/react"

// Helper function to convert a Blob to a base64 encoded string
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            // reader.result is a data URL in the format: "data:[<mediatype>][;base64],<data>"
            const result = reader.result as string
            // Remove the "data:" prefix and metadata so that only the base64 string remains
            const base64String = result.includes(",") ? result.split(",")[1] : result
            resolve(base64String)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

export const uploadVoiceNote = async (
    threadId: string,
    audio: Blob,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = BACKEND_BASE_URL + `/patient/chat/${threadId}/voice`

    // Convert the Blob (binary data) into a base64 encoded string.
    const base64Audio = await blobToBase64(audio)

    // Build the payload as expected by the backend endpoint.
    const payload = {
        content: base64Audio
        // Optionally include additional fields if needed, e.g.:
        // doctor_name: "Dr. Smith",
        // hospital_name: "General Hospital",
        // branch_name: "Cardiology"
    }

    let accumulatedMessage = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken

    const controller = new AbortController()
    const signal = controller.signal
    console.log("Connecting to voice note stream")

    await fetchEventSource(url, {
        signal,
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            Authorization: bearer,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            const credits = response.headers.get("x-credits") ?? ""
            if (response.ok && response.status === 200) {
                console.log("Voice note stream connection opened")
            } else if (response.status === 401) {
                signOut()
                onResponseError()
                controller.abort("auth")
            } else if (response.status === 403) {
                onInsufficientCredits()
                controller.abort("credits")
            } else {
                controller.abort("other")
            }
            return Promise.resolve()
        },
        onmessage(event) {
            // Accumulate the stream data (e.g., transcript tokens) and pass to the callback.
            accumulatedMessage += event.data
            onMessage(accumulatedMessage)
        },
        onerror(err) {
            console.error("Voice note stream error:", err)
            accumulatedMessage = ""
            controller.abort()
            onResponseError()
        },
        onclose() {
            console.log("Voice note stream connection closed")
            accumulatedMessage = ""
            onClose()
            return Promise.resolve()
        }
    })
}

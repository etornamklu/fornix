import { fetchEventSource } from "@microsoft/fetch-event-source"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { PatientsGptRequestProps } from "@/utils/types"
import { getBearerToken } from "@/utils/auth.server"
import { updateUserCredits } from "@/utils/dashboard/credit"
import { signOut } from "next-auth/react"
import { getDoctorData } from "@/services/auth/auth.service"

export const StreamPatientGPT = async (
    data: PatientsGptRequestProps,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const userCookie = await getDoctorData()
    const userCode = JSON.parse(userCookie?.value ?? "{}")?.user_code
    const sessionId = `${data.conversation_id}-${userCode}`
    // console.log("Generated Session:", sessionId);
    const url = `${BACKEND_BASE_URL}/patient/medfind/${sessionId}`
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken
    const controller = new AbortController()
    const signal = controller.signal

    console.log("Connecting to stream")
    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            Authorization: bearer
        },
        redirect: "follow",
        onopen(response) {
            if (response.ok && response.status === 200) {
                // console.log("Connection opened", response);
            } else if (response.status === 401) {
                signOut()
                // console.log('auth issue');
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
            try {
                // Check if the event data starts with "data: "
                if (event.data.startsWith("data: ")) {
                    // Remove the "data: " prefix
                    const rawData = event.data.replace("data: ", "")

                    // Parse the remaining string as JSON
                    const parsedData = JSON.parse(rawData)

                    // Extract the "content" field
                    if (parsedData.content) {
                        message += parsedData.content
                        onMessage(message)
                        // console.log("Streaming:", message);
                    }
                } else {
                    console.warn("Unexpected event data format:", event.data)
                }
            } catch (error) {
                console.error("Error parsing event data:", error)
            }
        },
        onerror() {
            message = ""
            controller.abort("connection")
            // console.log("Connection failed");
            return
        },
        onclose() {
            // console.log("Connection closed");
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const StreamPatientGPTFromVoice = async (
    audioFile: Blob,
    conversationId: string,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const userCookie = await getDoctorData()
    const userCode = JSON.parse(userCookie?.value ?? "{}")?.user_code
    const sessionId = `${conversationId}-${userCode}`
    // TODO: Change this to the real endpoint when backend is ready
    const url = `${BACKEND_BASE_URL}/doctor/chat/voice/${sessionId}`
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken

    const formData = new FormData()
    formData.append("file", audioFile, "recording.webm")

    const controller = new AbortController()
    const signal = controller.signal

    console.log("Connecting to voice medfind stream")

    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        body: formData,
        headers: {
            Authorization: bearer
        },
        redirect: "follow",
        onopen(response) {
            if (response.ok && response.status === 200) {
                console.log("Voice medfind connection opened", response)
            } else if (response.status === 401) {
                signOut()
                console.log("Voice medfind auth issue")
                controller.abort("auth")
            } else if (response.status === 403) {
                onInsufficientCredits()
                controller.abort("credits")
            } else {
                console.log("Voice medfind connection failed with status:", response.status)
                controller.abort("other")
            }
            return Promise.resolve()
        },
        onmessage(event) {
            if (!event.data.includes('{"tok')) {
                message += event.data
                onMessage(message)
                console.log("Voice medfind streaming:", message)
            }
        },
        onerror() {
            message = ""
            controller.abort("connection")
            console.log("Voice medfind connection failed")
            return
        },
        onclose() {
            console.log("Voice medfind stream closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

// Generic audio download for MedFind/doctor chat
export const downloadAnyAudio = async (audioId: string) => {
    const url = BACKEND_BASE_URL + "/audio/download/" + audioId
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    if (!response.ok) {
        throw new Error(`Error fetching audio: ${response.status}`)
    }

    return await response.blob()
}

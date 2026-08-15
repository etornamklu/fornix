import { fetchEventSource } from "@microsoft/fetch-event-source"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { DoctorsGptRequestProps } from "@/utils/types"
import { getBearerToken } from "@/utils/auth.server"
import { updateUserCredits } from "@/utils/dashboard/credit"
import { signOut } from "next-auth/react"
import { getDoctorData } from "@/services/auth/auth.service"

export const StreamDoctorGPT = async (
    data: DoctorsGptRequestProps,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const userCookie = await getDoctorData()
    const userCode = JSON.parse(userCookie?.value ?? "{}")?.user_code
    // const sessionId = `${data.conversation_id}-${userCode}`
    const sessionId = `${data.conversation_id}${data.conversation_id.includes(userCode) ? "" : `-${userCode}`}`
    console.log(sessionId)
    const url = `${BACKEND_BASE_URL}/doctor/chat/${sessionId}`
    let message = ""
    // console.log(data)
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
            // const credits = response.headers.get('x-credits') ?? ''
            // updateUserCredits(credits)
            if (response.ok && response.status === 200) {
                console.log("Connection opened", response)
            } else if (response.status === 401) {
                signOut()
                console.log("auth issue")
                // onResponseError()
                controller.abort("auth")
            } else if (response.status === 403) {
                onInsufficientCredits()
                controller.abort("credits")
            } else {
                // console.log("Summary Connection failed", response)
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
            message = ""
            controller.abort("connection")
            console.log("Connection failed")
            return
        },
        onclose() {
            console.log("Connection closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const renameChatSession = async (thread_id: string, name: string) => {
    const bearerToken = await getBearerToken()
    const url = `${BACKEND_BASE_URL}/doctor/chat-history/${thread_id}`

    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${bearerToken}`
            },
            body: JSON.stringify({ name })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error("Error renaming chat session:", error)
        throw error
    }
}

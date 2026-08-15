import { fetchEventSource } from "@microsoft/fetch-event-source"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { Diagnosis, DiagnosisStreamProps, DoctorDashboardDiagnosis, SummaryItem } from "@/utils/types"
import { clinicalKeys } from "@/utils/dashboard/diagnosis"
import { getBearerToken } from "@/utils/auth.server"
import { signOut } from "next-auth/react"
import { updateUserCredits } from "@/utils/dashboard/credit"

export const StreamSummary = async (
    patientData: DiagnosisStreamProps,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = BACKEND_BASE_URL + "/diagnosis/summary"
    // console.log(url)
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken
    // console.log(`bearer token ${bearer}`)

    const controller = new AbortController()
    const signal = controller.signal
    console.log("Connecting to summary stream")
    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        body: JSON.stringify(patientData),
        headers: {
            Authorization: bearer,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            const credits = response.headers.get("x-credits") ?? ""
            updateUserCredits(credits)
            if (response.ok && response.status === 200) {
                // console.log("Summary Connection opened", response)
            } else if (response.status === 401) {
                signOut()
                // console.log('auth issue')
                onResponseError()
                controller.abort("auth")
            } else if (response.status === 403) {
                // console.log('beans')
                onInsufficientCredits()
                controller.abort("credits")
            } else {
                // console.log("Summary Connection failed", response)
                controller.abort("other")
            }
            return Promise.resolve()
        },
        onmessage(event) {
            message += event.data
            onMessage(message)
        },
        onerror() {
            message = ""
            // console.log("Summary Connection failed")
            controller.abort()
            return
        },
        onclose() {
            console.log("Summary Connection closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const StreamAIPatientSummary = async (
    patientThreadId: string,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = `${BACKEND_BASE_URL}/doctor/summary_aip/${patientThreadId}`
    // console.log(url)
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken
    // console.log(`bearer token ${bearer}`)

    const controller = new AbortController()
    const signal = controller.signal
    console.log("Connecting to summary stream")
    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        headers: {
            Authorization: bearer,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            if (response.ok && response.status === 200) {
                // console.log("Summary Connection opened", response)
            } else if (response.status === 401) {
                signOut()
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
            message += event.data
            onMessage(message)
        },
        onerror() {
            message = ""
            // console.log("Summary Connection failed")
            controller.abort()
            return
        },
        onclose() {
            console.log("Summary Connection closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const StreamAmbientConversationSummary = async (
    jobId: string,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = `${BACKEND_BASE_URL}/diagnosis/summary/report/${jobId}`
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken

    const controller = new AbortController()
    const signal = controller.signal
    console.log("Connecting to ambient conversation summary stream")

    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        headers: {
            Authorization: bearer,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            if (response.ok && response.status === 200) {
                // Stream opened successfully.
            } else if (response.status === 401) {
                signOut()
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
            // Accumulate the streamed data
            message += event.data
            onMessage(message)
        },
        onerror(err) {
            message = ""
            console.error("Stream encountered an error: ", err)
            // Call the error callback and abort the stream.
            onResponseError()
            controller.abort()
        },
        onclose() {
            console.log("Ambient conversation summary stream closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const StreamSummaryFromVoice = async (
    audioFile: Blob,
    onMessage: (message: string) => void,
    onResponseError: () => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = BACKEND_BASE_URL + "/diagnosis/summary/voice"
    let message = ""
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken

    const formData = new FormData()
    formData.append("file", audioFile, "recording.webm")

    const controller = new AbortController()
    const signal = controller.signal

    console.log("Connecting to voice summary stream")

    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        body: formData,
        headers: {
            Authorization: bearer
            // Note: Don't set Content-Type for FormData - let browser set it with boundary
        },
        redirect: "follow",
        onopen(response) {
            console.log("Voice summary stream response:", response.status, response.statusText)
            const credits = response.headers.get("x-credits") ?? ""
            updateUserCredits(credits)
            if (response.ok && response.status === 200) {
                console.log("Voice summary stream opened successfully")
            } else if (response.status === 401) {
                console.log("Voice summary stream auth error")
                signOut()
                onResponseError()
                controller.abort("auth")
            } else if (response.status === 403) {
                console.log("Voice summary stream insufficient credits")
                onInsufficientCredits()
                controller.abort("credits")
            } else {
                console.log("Voice summary stream other error:", response.status)
                onResponseError()
                controller.abort("other")
            }
            return Promise.resolve()
        },
        onmessage(event) {
            console.log("Voice summary stream message received:", event.data)
            message += event.data
            onMessage(message)
        },
        onerror(err) {
            console.log("Voice summary stream error:", err)
            message = ""
            onResponseError()
            controller.abort()
        },
        onclose() {
            console.log("Voice summary stream closed")
            message = ""
            onClose()
        }
    })
}

export const StreamDiagnosis = async (
    summary: string,
    onMessage: (message: string) => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = BACKEND_BASE_URL + "/diagnosis/diagnose"
    let message = ""
    const bearerToken = await getBearerToken()
    const controller = new AbortController()
    const signal = controller.signal

    console.log("Connecting to diagnosis stream")
    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        body: JSON.stringify({ summary }),
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            const credits = response.headers.get("x-credits") ?? ""
            updateUserCredits(credits)
            if (response.ok && response.status === 200) {
                // console.log("Diagnosis Connection opened", response)
            } else if (response.status === 401) {
                signOut()
                // console.log('auth issue')
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
            message += event.data
            onMessage(message)
            // console.log(message)
        },
        onerror() {
            message = ""
            // console.log("Diagnosis Connection failed")
            controller.abort()
        },
        onclose() {
            console.log("Diagnosis Connection closed")
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const StreamClinicalCompletion = async (
    // TODO: get proper type for this
    data: any,
    onMessage: (message: string) => void,
    onClose: () => void,
    onInsufficientCredits: () => void
) => {
    const url = BACKEND_BASE_URL + "/diagnosis/diagnose/clinical"
    let message = ""
    // console.log(data)
    const controller = new AbortController()
    const signal = controller.signal

    console.log("Connecting to Clinical stream")
    await fetchEventSource(url, {
        signal: signal,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`,
            "Content-Type": "application/json"
        },
        redirect: "follow",
        onopen(response) {
            const credits = response.headers.get("x-credits") ?? ""
            updateUserCredits(credits)
            if (response.ok && response.status === 200) {
                // console.log("Clinical Connection opened", response)
            } else if (response.status === 401) {
                signOut()
                // console.log('auth issue')
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
            console.log(message)
        },
        onerror() {
            message = ""
            // console.log("Clinical Connection failed")
            return
        },
        onclose() {
            console.log("Clinical Connection closed")
            // console.log(message)
            message = ""
            onClose()
            return Promise.resolve()
        }
    })
}

export const storeSummary = (summary: string) => {
    const diagObj = {} as DoctorDashboardDiagnosis
    diagObj.summary = summary
    window.localStorage.setItem("diag", JSON.stringify(diagObj))
}

export const storeDiagnosis = (diagnosis: Diagnosis | null) => {
    const diagObj = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
    if (diagnosis?.differential_diagnosis && diagnosis.alternative_diagnoses.length > 0) {
        diagObj.differential_diagnosis = diagnosis.differential_diagnosis
        diagObj.alternative_diagnoses = diagnosis.alternative_diagnoses
    }
    window.localStorage.setItem("diag", JSON.stringify(diagObj))
}

export const storeClinicalItem = (
    primaryDiagnosisIndex: number,
    clinicalKey: { name: string; value: string },
    clinicalData: (string | { key: string; value: string })[]
) => {
    // if (typeof window !== "undefined")
    // window.localStorage.setItem(clinicalKey.value, JSON.stringify(clinicalData))
    const diagObj = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
    diagObj.primary_index = primaryDiagnosisIndex
    const diagClinicalItems = diagObj.clinical_items
    const newClinicalItem = { [clinicalKey.value]: clinicalData }
    const newKey = Object.keys(newClinicalItem)[0]
    const replacementIndex = diagClinicalItems.findIndex(obj => Object.keys(obj)[0] === newKey)
    if (replacementIndex !== -1) diagClinicalItems[replacementIndex] = newClinicalItem
    else diagClinicalItems.push(newClinicalItem)

    window.localStorage.setItem("diag", JSON.stringify(diagObj))
    return diagObj
}

export const clearAllDiagnosisData = () => {
    window.localStorage.removeItem("summary")

    window.localStorage.removeItem("diagnosis")
    window.localStorage.removeItem("diag")

    window.localStorage.removeItem("aip_t")

    clinicalKeys.forEach(key => {
        window.localStorage.removeItem(key.value)
    })
}

export const unlinkPatientFromDiagnosis = async (diagnosisId: string) => {
    const url = `${BACKEND_BASE_URL}/ddd/${diagnosisId}/unlink-patient`
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error(`PATCH ${url} failed:`, errText)
        throw new Error(errText || `Failed to unlink patient from diagnosis with ID ${diagnosisId}`)
    }

    const credits = response.headers.get("x-credits") ?? ""
    await updateUserCredits(credits)

    return await response.json()
}

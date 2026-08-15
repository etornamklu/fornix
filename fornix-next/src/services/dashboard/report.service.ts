// in this file we will have all report-based service functions:
// GET all reports of x type
// POST report of x type
// etc

import { ReportListItem, ReportType } from "@/utils/types"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { useSelectedPatientStore } from "../../../store/SelectedPatientStore"

export const uploadRecording = async (
    audioBlob: Blob,
    filename: string,
    reportType: ReportType,
    onMessage: (partialText: string, reportId?: string) => void,
    onClose: (reportId?: string) => void,
    onError?: (error: Error) => void,
    onController?: (controller: AbortController) => void
) => {
    const { selectedPatient } = useSelectedPatientStore.getState()

    const controller = new AbortController()
    if (onController) onController(controller)
    let accumulatedText = ""
    const form = new FormData()
    form.append("file", audioBlob, filename)

    let reportId: string | undefined = undefined

    const url = selectedPatient
        ? `${BACKEND_BASE_URL}/doctor/report?report_type=${reportType}&patient_id=${selectedPatient.id}`
        : `${BACKEND_BASE_URL}/doctor/report?report_type=${reportType}`

    // Global timeout guard for hanging connections
    const TIMEOUT_MS = 30000
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
        // Include ?type=physical in the URL

        const streamPromise = fetchEventSource(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${await getBearerToken()}`
            },
            body: form,
            signal: controller.signal,
            onopen: async response => {
                if (!response.ok) {
                    const text = await response.text()
                    const err = new Error(text || "Failed to start audio processing")
                    onError && onError(err)
                    throw err
                }
            },
            onmessage: event => {
                const data = event.data
                /* console.log("Received data:", data) */

                // 1) The very first message is {"report_id": "…"}
                if (data.startsWith("{\"report_id\"")) {
                    const parsed = JSON.parse(data)
                    reportId = parsed.report_id
                    console.log("Received report_id:", reportId)
                    onMessage("", reportId)
                    return
                }

                // 2) Skip any token statistics messages (e.g. {"token_stat": …})
                if (data.startsWith("{\"token_stats\"")) {
                    return
                }

                if (data.startsWith('{"error"')) {
                    try {
                        const parsed = JSON.parse(data)
                        controller.abort()
                        const err = new Error(parsed.error || "There was an error processing audio")
                        onError && onError(err)
                        throw err
                    } catch {
                        controller.abort()
                        const err = new Error("Audio processing failed")
                        onError && onError(err)
                        throw err
                    }
                }

                // 3) Otherwise, it’s part of the final JSON payload
                accumulatedText += data
                /* console.log("Accumulated text:", accumulatedText) */
                // TODO: @Max
                onMessage(accumulatedText, reportId)
            },

            onclose: async () => {
                if (!reportId) {
                    console.warn("No report_id was received.")
                    const err = new Error("Server did not return a report_id")
                    onError && onError(err)
                    throw err
                }

                // Await close handler so any thrown error propagates to caller
                await onClose(reportId)
            },

            onerror: err => {
                controller.abort()
                const error = new Error((err as Error)?.message || "Audio processing failed")
                onError && onError(error)
                throw error
            }
        })

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                controller.abort()
                const err = new Error("Request timed out")
                onError && onError(err)
                reject(err)
            }, TIMEOUT_MS)
        })

        await Promise.race([streamPromise, timeoutPromise])
    } catch (error) {
        // Propagate the error out to your component
        // lmao why
        throw error instanceof Error ? error : new Error("Failed to process audio recording")
    } finally {
        if (timeoutId) clearTimeout(timeoutId)
        controller.abort()
    }
}

export async function uploadReportChunk({
                                            file,
                                            reportType,
                                            reportId,
                                            patientId,
                                            lastChunk,
                                            onMessage,
                                            onClose
                                        }: {
    file: Blob
    reportType: ReportType
    reportId?: string
    patientId?: string
    lastChunk: boolean
    onMessage?: (partial: string, reportId?: string) => void
    onClose?: (reportId?: string) => void
}): Promise<{ reportId?: string }> {
    const form = new FormData()
    const filename = file.type.includes("ogg") ? "chunk.ogg" : "chunk.webm"
    form.append("file", file, filename)

    const params = new URLSearchParams()
    params.set("report_type", String(reportType))
    if (patientId) params.set("patient_id", patientId)
    if (reportId) params.set("report_id", reportId)
    if (lastChunk) params.set("last_chunk", "true")

    const url = `${BACKEND_BASE_URL}/doctor/report?${params.toString()}`

    let transitReportId: string | undefined = reportId

    if (!lastChunk) {
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${await getBearerToken()}` },
            body: form
        })

        if (!res.ok) {
            const message = await res.text()
            throw new Error(message || "Chunk upload failed")
        }

        const data = (await res.json()) as { report_id?: string }
        return { reportId: data.report_id ?? reportId }
    }

    if (lastChunk) {
        const controller = new AbortController()
        await fetchEventSource(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${await getBearerToken()}` },
            body: form,
            signal: controller.signal,

            onopen: async response => {
                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(text || "Failed to finalise")
                }
            },

            onmessage: event => {
                const data = event.data
                // console.log("Received data:", data)
                if (data.startsWith("{\"report_id\"")) {
                    try {
                        const parsed = JSON.parse(data)
                        onMessage?.("", parsed.report_id)
                        transitReportId = parsed.report_id
                        console.log(transitReportId)
                    } catch {
                    }
                    return
                }

                if (data.startsWith("{\"token_stats\"")) {
                    return
                }

                onMessage?.(data, reportId)
            },

            onclose: () => {
                console.log(transitReportId)
                onClose?.(reportId?.length ? reportId : transitReportId)
            },

            onerror: err => {
                controller.abort()
                throw new Error(err?.message || "Finalisation failed")
            }
        })
    }
    return { reportId }
}

export const getAllReports = async (reportType: ReportType) => {
    // to get all existing reports of type x
    const url = `${BACKEND_BASE_URL}/doctor/report?report_type=${reportType}`
    const token = await getBearerToken()
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    console.log("checking response", response)
    console.log("checking the url", url)

    if (!response.ok) {
        const errText = await response.text()
        console.error(`GET ${url} failed:`, errText)
        throw new Error(errText || "Failed to fetch reports")
    }

    try {
        const data = await response.json()
        if (!Array.isArray(data)) {
            console.error(`Unexpected response shape for GET ${url}:`, data)
            throw new Error("Invalid data format for physical examinations list")
        }
        console.log("checking data", data)
        return data as ReportListItem[]
    } catch (parseError: any) {
        console.error(`Error parsing JSON from GET ${url}:`, parseError)
        throw new Error("Failed to parse physical examination reports")
    }
}

export const getReportById = async (id: string) => {
    // to get a particular report of type x
    const url = `${BACKEND_BASE_URL}/doctor/report/${id}`
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error(`GET ${url} failed:`, errText)
        throw new Error(errText || `Failed to fetch report with ID ${id}`)
    }

    try {
        // the type is in the response data
        return await response.json()
    } catch (parseError: any) {
        console.error(`Error parsing JSON from GET ${url}:`, parseError)
        throw new Error(`Invalid data format for report with ID ${id}`)
    }
}

export const updateReport = async (id: string, data: any, reportType: ReportType) => {
    // update the fields of a particular report
    const url = `${BACKEND_BASE_URL}/doctor/report/${id}`
    console.log("checking the data here xxxx", JSON.stringify(data))
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getBearerToken()}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error(`PATCH ${url} failed:`, errText)
        throw new Error(errText || `Failed to update report with ID ${id}`)
    }

    return await response.json()
}

export const unlinkPatientFromReport = async (reportId: string) => {
    const url = `${BACKEND_BASE_URL}/doctor/report/${reportId}/unlink-patient`
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error(`PATCH ${url} failed:`, errText)
        throw new Error(errText || `Failed to unlink patient from report with ID ${reportId}`)
    }

    return await response.json()
}

export const deleteReport = async (id: string, reportType: ReportType) => {
    // to delete a report of type x
    const url = `${BACKEND_BASE_URL}/doctor/report/${id}`
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${await getBearerToken()}`
        }
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error(`DELETE ${url} failed:`, errText)
        throw new Error(errText || `Failed to delete report with ID ${id}`)
    }

    return true
}

export const getAllReportTypes = async () => {
    const url = `${BACKEND_BASE_URL}/doctor/report`
    const token = await getBearerToken()
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || "Failed to fetch reports")
    }

    try {
        const data = await response.json()
        if (!Array.isArray(data)) {
            console.error(`Unexpected response shape for GET ${url}:`, data)
            throw new Error("Invalid data format for physical examinations list")
        }
        // console.log("checking all report types", data)
        return data as ReportListItem[]
    } catch (parseError: any) {
        console.error(`Error parsing JSON from GET ${url}:`, parseError)
        throw new Error("Failed to parse physical examination reports")
    }
}

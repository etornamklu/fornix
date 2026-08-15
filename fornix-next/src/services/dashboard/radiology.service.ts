import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { RadiologyReport, RadiologyReportType } from "@/utils/types"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { signOut } from "next-auth/react"
import { updateUserCredits } from "@/utils/dashboard/credit"

export const getRadiologyReports = async (reportType?: string): Promise<RadiologyReport[]> => {
    try {
        const bearerToken = await getBearerToken()
        const url = reportType
            ? `${BACKEND_BASE_URL}/radiologist/reports?report_type=${reportType}`
            : `${BACKEND_BASE_URL}/radiologist/reports`

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json"
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        console.log(data)

        // Transform backend data to match our expected format
        return data.map((report: any) => ({
            id: report.id || report._id,
            name: report.name || `${report.report_type?.toUpperCase()} Report ${report.id}`,
            created_at: report.created_at || report.createdAt || new Date().toISOString(),

            // Schema fields
            patient_id: report.patient_id,
            report_type: report.type,

            // Optional display fields
            patient_name: report.patient_name || report.patientName
        }))
    } catch (error) {
        console.error("Error fetching radiology reports:", error)
        // Return empty array on error instead of throwing
        return []
    }
}

export interface ReportMetadata {
    clinical_context: string
    report_type: "xray" | "ct_scan" | "ecg" | "ultrasound"
}

export interface ReportListItem {
    id: string
    name: string
    created_at: string
    updated_at: string
    patient_id: string | null
    report_type: string
    clinical_context: string
}

export interface ReportUpdate {
    name?: string
    clinical_context?: string
    content?: Record<string, any>
}

export interface StreamResponse {
    report_id?: string
    content?: string
    error?: string
    token_stat?: any
}

export interface ReportDetails {
    id: string
    name: string
    type: string
    clinical_context: string
    content: Record<string, any>
    created_at: string
    updated_at: string
    patient_id: string | null
    patient_age: number | null
    patient_gender: string | null
    patient_age_unit: string | null
}

// Stream radiology image analysis - Updated to handle streaming like report service
export const StreamRadiologyAnalysis = async (
    files: File[],
    metadata: ReportMetadata,
    onMessage: (partialText: string, reportId?: string) => void,
    onClose: (reportId?: string) => void,
    onResponseError: () => void,
    onInsufficientCredits: () => void
) => {
    const url = `${BACKEND_BASE_URL}/radiologist/reports`
    let accumulatedText = ""
    let reportId: string | undefined = undefined
    const bearerToken = await getBearerToken()
    const bearer = "Bearer " + bearerToken

    const controller = new AbortController()
    const signal = controller.signal

    // Create form data
    const formData = new FormData()
    files.forEach(file => {
        formData.append("files", file)
    })
    formData.append("request", JSON.stringify(metadata))

    console.log("Connecting to radiology analysis stream")

    try {
        await fetchEventSource(url, {
            signal: signal,
            method: "POST",
            body: formData,
            headers: {
                Authorization: bearer
            },
            redirect: "follow",
            onopen: async response => {
                const credits = response.headers.get("x-credits") ?? ""
                updateUserCredits(credits)

                if (!response.ok) {
                    if (response.status === 401) {
                        signOut()
                        onResponseError()
                        controller.abort()
                    } else if (response.status === 403) {
                        onInsufficientCredits()
                        controller.abort()
                    } else {
                        const text = await response.text()
                        console.log("Radiology analysis connection failed", response)
                        onResponseError()
                        throw new Error(text || "Failed to start radiology analysis")
                    }
                }
                console.log("Radiology analysis connection opened", response)
            },
            onmessage: event => {
                const data = event.data
                console.log("Received data:", data)

                // 1) The very first message is {"report_id": "…"}
                if (data.startsWith('{"report_id"')) {
                    const parsed = JSON.parse(data)
                    reportId = parsed.report_id
                    console.log("Received report_id:", reportId)
                    onMessage("", reportId)
                    return
                }

                // 2) Skip any token statistics messages (e.g. {"token_stats": …})
                if (data.startsWith('{"token_stats"')) {
                    return
                }

                // 3) Handle error messages
                if (data.startsWith('{"error"')) {
                    const parsed = JSON.parse(data)
                    console.error("Received error:", parsed.error)
                    onResponseError()
                    controller.abort()
                    return
                }

                // 4) Otherwise, it's part of the final content payload
                accumulatedText += data
                console.log("Accumulated text:", accumulatedText)
                onMessage(accumulatedText, reportId)
            },
            onclose: async () => {
                if (!reportId) {
                    console.warn("No report_id was received.")
                    throw new Error("Server did not return a report_id")
                }
                console.log("Radiology analysis connection closed")
                onClose(reportId)
            },
            onerror: err => {
                console.log("Radiology analysis connection failed", err)
                onResponseError()
                controller.abort()
                throw new Error(err.message || "Radiology analysis failed")
            }
        })
    } catch (error) {
        // Propagate the error out to your component
        throw error instanceof Error ? error : new Error("Failed to process radiology analysis")
    } finally {
        controller.abort()
    }
}

// Get list of reports by type
export const getReportsByType = async (reportType: ReportMetadata["report_type"]): Promise<ReportListItem[]> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/radiologist/reports?report_type=${reportType}`, {
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

// Get all reports
export const getAllReports = async (): Promise<ReportListItem[]> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/radiologist/reports`, {
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

// Get a specific report by ID
export const getReportById = async (reportId: string): Promise<ReportDetails> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/radiologist/reports/${reportId}`, {
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

    const data = await response.json()
    data.report_type = data.type
    return data
}

// Update a report
export const updateReport = async (reportId: string, updates: ReportUpdate): Promise<ReportDetails> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/radiologist/reports/${reportId}`, {
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

// Delete a report
export const deleteReport = async (reportId: string): Promise<{ message: string }> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/radiologist/reports/${reportId}`, {
        method: "DELETE",
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

// Store report data in localStorage (following your project pattern)
export const storeRadiologyReport = (reportId: string, content: string) => {
    const reportData = {
        report_id: reportId,
        content: content,
        timestamp: new Date().toISOString()
    }
    window.localStorage.setItem("radiology_report", JSON.stringify(reportData))
}

// Clear radiology report data from localStorage
export const clearRadiologyReportData = () => {
    window.localStorage.removeItem("radiology_report")
}

// Get a specific lab test report by ID
export const getLabTestReportById = async (reportId: string): Promise<ReportDetails> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/labs/reports/${reportId}`, {
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

    const data = await response.json()
    data.report_type = data.type
    return data
}

export const StreamLabTestAnalysis = async (
    files: File[],
    metadata: { report_type: string; clinical_context: string },
    onMessage: (partialText: string, reportId?: string) => void,
    onClose: (reportId?: string) => void,
    onError: (err: any) => void
) => {
    const bearerToken = await getBearerToken()
    if (!bearerToken) throw new Error("Authentication token not found.")

    const formData = new FormData()
    files.forEach(file => formData.append("files", file))
    formData.append("request", JSON.stringify(metadata))

    const controller = new AbortController()
    let reportId: string | undefined = undefined
    let accumulatedText = ""

    try {
        await fetchEventSource(`${BACKEND_BASE_URL}/labs/reports`, {
            method: "POST",
            headers: { Authorization: `Bearer ${bearerToken}` },
            body: formData,
            signal: controller.signal,
            onopen: async response => {
                if (!response.ok) {
                    controller.abort()
                    const errorData = await response.json().catch(() => ({}))
                    onError(new Error(`API Error: ${JSON.stringify(errorData.detail || response.statusText)}`))
                }
            },
            onmessage: event => {
                const data = event.data

                if (data.startsWith('{"report_id"')) {
                    reportId = JSON.parse(data).report_id
                    return
                }
                if (data.startsWith('{"error"')) {
                    onError(new Error(JSON.parse(data).error))
                    controller.abort()
                    return
                }
                if (data.startsWith('{"token_stats"')) {
                    return
                }

                accumulatedText += data
                onMessage(accumulatedText, reportId)
            },
            onclose: () => {
                onClose(reportId)
            },
            onerror: err => {
                onError(err)
                throw err
            }
        })
    } catch (error: any) {
        onError(error)
    }
}

export const getLabTestReports = async (reportType?: string): Promise<ReportListItem[]> => {
    try {
        const bearerToken = await getBearerToken()
        const url = reportType
            ? `${BACKEND_BASE_URL}/labs/reports?report_type=${reportType}`
            : `${BACKEND_BASE_URL}/labs/reports`

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json"
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        return data.map((report: any) => ({
            id: report.id || report._id,
            name: report.name || `${report.type?.toUpperCase()} Report ${report.id}`,
            created_at: report.created_at || report.createdAt || new Date().toISOString(),
            updated_at: report.updated_at || report.updatedAt || new Date().toISOString(),
            patient_id: report.patient_id,
            report_type: report.type,
            clinical_context: report.clinical_context || ""
        }))
    } catch (error) {
        console.error("Error fetching lab test reports:", error)
        return []
    }
}

export const updateLabTestReport = async (reportId: string, updates: { name?: string }): Promise<ReportDetails> => {
    const bearerToken = await getBearerToken()
    const response = await fetch(`${BACKEND_BASE_URL}/labs/reports/${reportId}`, {
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

    const data = await response.json()
    data.report_type = data.type
    return data
}

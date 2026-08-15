import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken, getUserData } from "@/utils/auth.server"
import { DoctorDashboardDiagnosis, Message, PatientMedicalNotes } from "@/utils/types"
import { signOut } from "next-auth/react"
import { updateUserCredits } from "@/utils/dashboard/credit"
import { convertBlobToWav } from "@/utils/dashboard/converToWav"
import { fetchEventSource } from "@microsoft/fetch-event-source"

export const getAllDiagnoses = async () => {
    const url = BACKEND_BASE_URL + "/ddd/"
    const bearerToken = await getBearerToken()

    const diagResp = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    if (diagResp.status === 401) signOut()

    return diagResp.status === 200 ? await diagResp.json() : null
}

export const createDiagnosis = async (diagnosis: Partial<DoctorDashboardDiagnosis>) => {
    console.log("i am storing new diagnosis")

    const url = BACKEND_BASE_URL + "/ddd/"
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...diagnosis })
    })

    const credits = response.headers.get("x-credits") ?? ""
    await updateUserCredits(credits)

    if (response.status !== 200) return null

    try {
        return (await response.json()).doctor_dashboard_diagnosis as DoctorDashboardDiagnosis
    } catch (err) {
        console.log(err)
        return null
    }
}

export const updateDiagnosis = async (diagId: string, updatedFields: Partial<DoctorDashboardDiagnosis>) => {
    const url = BACKEND_BASE_URL + "/ddd/?diag_id=" + diagId
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...updatedFields })
    })

    const credits = response.headers.get("x-credits") ?? ""
    await updateUserCredits(credits)

    if (response.status !== 200) return null

    try {
        return (await response.json()).doctor_dashboard_diagnosis as DoctorDashboardDiagnosis
    } catch (err) {
        console.log(err)
        return null
    }
}

export const deleteDiagnosis = async (diagId: string) => {
    const url = BACKEND_BASE_URL + `/ddd/?diag_id=${diagId}`
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        }
    })

    const credits = response.headers.get("x-credits") ?? ""
    await updateUserCredits(credits)

    return response.status === 200
}

//---------------patient questionnaire history services -------

export const getPatientQuestionnaireHistory = async () => {
    const userData = await getUserData()
    if (!userData) {
        signOut()
    }

    const url = BACKEND_BASE_URL + "/patient/threads/" + userData.id
    const bearerToken = await getBearerToken()
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })
    if (response.status === 401) {
        signOut()
    }
    if (response.ok) {
        const data = await response.json()
        return data
    }
    return null
}

export const getPatientChatHistory = async (threadId: string) => {
    const url = BACKEND_BASE_URL + "/patient/chat-history/" + threadId
    const bearerToken = await getBearerToken()
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })
    if (response.status === 401) {
        signOut()
    }
    if (response.ok) {
        const data = await response.json()
        return data
    }
}

//---------------transcribing services --------------------

export const uploadAudioRecording = async (audio: Blob) => {
    const url = BACKEND_BASE_URL + "/doc-patient/upload"
    const bearerToken = await getBearerToken()

    const formData = new FormData()
    formData.append("audio_file", audio, `audioFile_${Date.now()}`)

    const resBody = {
        res: null,
        uploadErr: null
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bearerToken}`
            },
            body: formData
        })

        const credits = response.headers.get("x-credits") ?? ""
        await updateUserCredits(credits)

        if (response.status === 401) {
            signOut()
        }

        if (response.ok) {
            const data = await response.json()
            return { ...resBody, res: data }
        } else {
            console.log("upload failed")
            return { ...resBody, uploadErr: "Upload failed" }
        }
    } catch (error) {
        console.log("Network error: ", error)
        return { ...resBody, uploadErr: "Network Error" }
    }
}

export const transcribe = async (audioId: string) => {
    // console.log(audioId)
    const url = BACKEND_BASE_URL + "/doc-patient/transcribe"
    const bearerToken = await getBearerToken()
    // console.log(bearerToken)
    const formData = new FormData()

    const resBody = {
        res: null,
        transcribeErr: null
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                upload_id: audioId,
                task: "transcribe"
            })
        })

        const credits = response.headers.get("x-credits") ?? ""
        await updateUserCredits(credits)

        if (response.status === 401) {
            signOut()
        }

        if (response.ok) {
            const data = await response.json()
            return { ...resBody, res: data }
        } else {
            console.log(response)
            console.error("Transcription failed with status: ", response.status)
            return { ...resBody, transcribeErr: "Transcription failed" }
        }
    } catch (error) {
        console.error("Network error: ", error)
        return {
            ...resBody,
            transcribeErr: "Network error, please check your connection"
        }
    }
}

//history taking chunked uploader
export async function uploadHistoryTakingChunk({
    file,
    reportId,
    patientId,
    lastChunk,
    onMessage,
    onClose
}: {
    file: Blob
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
    if (patientId) params.set("patient_id", patientId)
    if (reportId) params.set("report_id", reportId)
    if (lastChunk) params.set("last_chunk", "true")

    const url = `${BACKEND_BASE_URL}/doc-patient/report/new?${params.toString()}`

    let transitReportId: string | undefined = reportId

    // not a final chunk
    if (!lastChunk) {
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${await getBearerToken()}` },
            body: form
        })

        if (!res.ok) {
            const message = await res.text()
            throw new Error(message || "History taking chunk upload failed")
        }

        const data = (await res.json()) as { report_id?: string }

        //use the report id from the backend and incase it fails, use what we already have stored
        return { reportId: data.report_id ?? reportId }
    }

    //this is the final chunk
    const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${await getBearerToken()}` },
        body: form
    })

    if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "History taking failed")
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
        onClose?.(transitReportId)
        return { reportId: transitReportId }
    }

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n").filter(line => line.trim())
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line)
                    if (parsed.report_id && !transitReportId) {
                        transitReportId = parsed.report_id
                        onMessage?.("", transitReportId)
                        continue
                    }
                    if (parsed.stream !== undefined) {
                        onMessage?.(line, transitReportId)
                        continue
                    }
                    if (parsed.raw_transcript !== undefined) {
                        onMessage?.(line, transitReportId)
                        continue
                    }
                    if (parsed.token_stats !== undefined) {
                        continue
                    }
                } catch {
                    // ignore malformed lines
                }
            }
        }
    } finally {
        reader.releaseLock()
        onClose?.(transitReportId)
    }

    return { reportId: transitReportId }
}

//New history taking chunk implementation
export const uploadHistoryTakingWithChunks = async (
    audioBlob: Blob,
    options: {
        patientId?: string
        name?: string
        address?: string
        onMessage?: (partialText: string, reportId?: string) => void
        onClose?: (reportId?: string) => void
        onError?: (error: Error) => void
        onCancel?: (controller: AbortController) => void
    } = {}
): Promise<string | null> => {
    const { patientId, name, address, onMessage, onClose, onError, onCancel } = options

    try {
        // Convert to WAV format first
        const wavFile = await convertBlobToWav(audioBlob)

        const bearerToken = await getBearerToken()

        // Create AbortController for cancellation
        const controller = new AbortController()
        onCancel?.(controller)

        // Build URL with query parameters instead of form data for non-file fields
        const url = new URL(BACKEND_BASE_URL + "/doc-patient/report/new")
        if (patientId) url.searchParams.append("patient_id", patientId)
        if (name) url.searchParams.append("name", name)
        if (address) url.searchParams.append("address", address)
        url.searchParams.append("last_chunk", "true")

        const formData = new FormData()
        // Only send the file in FormData - other params go in URL
        formData.append("file", wavFile, `history-taking-report.wav`)

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bearerToken}`
            },
            body: formData,
            signal: controller.signal
        })

        if (response.status === 401) {
            signOut()
            return null
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
            throw new Error("No response body reader available")
        }

        let accumulatedText = ""
        let currentReportId: string | undefined

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split("\n").filter(line => line.trim())

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line)

                        // Extract report_id from the first message
                        if (parsed.report_id && !currentReportId) {
                            currentReportId = parsed.report_id
                            console.log("Received report ID:", currentReportId)
                        }

                        // Handle streaming content
                        if (parsed.stream) {
                            accumulatedText += parsed.stream
                            onMessage?.(accumulatedText, currentReportId)
                        }

                        // Handle raw_transcript separately if needed
                        if (parsed.raw_transcript) {
                            console.log("Received raw transcript:", parsed.raw_transcript)
                        }
                    } catch (parseError) {
                        console.warn("Failed to parse SSE line:", parseError)
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }

        onClose?.(currentReportId)
        return currentReportId || null
    } catch (error) {
        console.error("Upload history taking with chunks error:", error)
        onError?.(error as Error)
        return null
    }
}

//generate report
export const generateReport = async (jobId: string, chunkSize = 1000, returnRaw = true) => {
    const url = BACKEND_BASE_URL + "/doc-patient/report"
    const bearerToken = await getBearerToken()

    const requestBody = {
        job_id: jobId,
        chunk_size: chunkSize,
        return_raw: returnRaw
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })

        if (response.status === 401) {
            signOut()
        }

        if (response.ok) {
            const reader = response?.body?.getReader()
            const decoder = new TextDecoder("utf-8")
            let reportData = ""
            let done = false

            while (!done) {
                const { value, done: streamDone } = await reader?.read()!
                done = streamDone

                const chunk = decoder.decode(value, { stream: true })
                reportData += chunk
            }
            console.log("report data", reportData)
            return reportData
        }
    } catch (error) {
        console.log("transcription Error", error)
    }
}

//check job status
export const checkJobStatus = async (jobId: string) => {
    const url = BACKEND_BASE_URL + "/doc-patient/job/" + jobId
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    const credits = response.headers.get("x-credits") ?? ""
    await updateUserCredits(credits)

    if (response.status === 401) {
        signOut()
    }
    if (response.ok) {
        const data = await response.json()
        return data
    }
    return null
}

/**
 * Parses a malformed stream response by combining chunks properly
 * @param streamData - The raw stream response string
 * @returns Parsed object with combined stream data
 */
export const parseStreamResponse = (streamData: string): Record<string, any> => {
    console.log("Parsing has started")

    console.log(streamData)

    try {
        // First, extract the raw transcript if it exists
        const transcriptMatch = streamData.match(/"raw_transcript":\s*({[^}]+})/)
        const rawTranscript = transcriptMatch ? JSON.parse(transcriptMatch[1]) : null

        // Extract all stream chunks
        // const streamChunks = streamData.match(/{"stream":\s*"((?:\\.|[^"\\])*)"}/g) || []
        //
        // // Combine stream chunks into a single string
        // let combinedStream = ""
        // streamChunks.forEach(chunk => {
        //     console.log(chunk)
        //     // Extract the actual content between quotes
        //     // const content = chunk.match(/"stream":\s*"([^"]*)"/)?.[1] || ""
        //     const content = chunk.replace(/\\"/g, "\"").replace(/\\:/g, ":")
        //     combinedStream += content
        // })
        //
        // console.log("this is combined stream", combinedStream)

        const regex = /{"stream":\s*"((?:\\.|[^"\\])*)"}/g
        let match
        let combinedStream = ""

        // Extract and concatenate each captured stream value.
        while ((match = regex.exec(streamData)) !== null) {
            combinedStream += match[1]
        }

        // Remove escape characters for quotes and colons.
        combinedStream = combinedStream.replace(/\\"/g, '"').replace(/\\:/g, ":")

        console.log(combinedStream)

        // Parse the resulting JSON string into an object.
        const resultObj = JSON.parse(combinedStream)

        console.log(resultObj)

        // Try to parse the combined stream as JSON
        let streamJson = {}
        try {
            // const parsedMedicalNotes = parsePatientMedicalNotes(combinedStream)
            const parsedMedicalNotes = resultObj as PatientMedicalNotes
            console.log("parsedMedicalNotes", parsedMedicalNotes)

            if (parsedMedicalNotes) {
                streamJson = parsedMedicalNotes
            }

            console.log("Stream JSON", streamJson)
        } catch (e) {
            console.warn("Failed to parse stream JSON:", e)
            console.log("combinedStream", combinedStream)
        }

        // Extract token stats if they exist
        const tokenStatsMatch = streamData.match(/"token_stats":\s*({[^}]+})/)
        const tokenStats = tokenStatsMatch ? JSON.parse(tokenStatsMatch[1]) : null

        // Combine everything into a single object
        return {
            raw_transcript: rawTranscript,
            medical_notes: streamJson,
            token_stats: tokenStats
        }
    } catch (error) {
        throw new Error(`Failed to parse stream response: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
}

/**
 * Process the stream response with error handling
 * @param responseText - Raw response text from the stream API
 * @returns Processed data object
 */
export const processStreamResponse = (responseText: string) => {
    try {
        // Handle the response line by line for streaming data
        const lines = responseText.split("\n")
        let result: {
            raw_transcript: Record<string, any> | null
            medical_notes: PatientMedicalNotes | null
            token_stats: Record<string, any> | null
        } = {
            raw_transcript: null,
            medical_notes: null,
            token_stats: null
        }

        for (const line of lines) {
            if (!line.trim()) continue

            try {
                const parsedLine = parseStreamResponse(line)
                result = { ...result, ...parsedLine }
            } catch (e) {
                console.warn("Failed to parse line:", e)
            }
        }
        return result
    } catch (error) {
        throw new Error(`Error processing stream response: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
}

/**
 * Parse transcript into array of messages with speaker and text
 * @param transcript - Raw text transcript
 * @returns Processed array of messages
 */
export const parseTranscript = (transcript: string) => {
    const regex = /(patient|doctor):\s*([^]+?)(?=(?:\bpatient\b|\bdoctor\b|$))/g
    const messages: Message[] = []

    let match
    while ((match = regex.exec(transcript)) !== null) {
        const speaker = match[1]
        const text = match[2].trim()
        messages.push({ speaker, message: text })
    }

    return messages
}

/*
const parsePatientMedicalNotes = (inputString: string): PatientMedicalNotes | null => {
    try {
        //clean up the input string.
        const cleanInput = inputString
            .replace(/\n(?!\w)/g, "") // Remove newline characters not followed by a word character
            .replace(/\s+/g, " ") //replace multiple spaces with a single space
            .replace(/[\[\]{}]/g, "") //remove all square and curly brackets
            .replace(/(?<!\w),|,(?!\w)/g, "") //remove all commas that are not preceded by a word character and followed by a word character
            .trim()
        //Initialize the result object
        const result: PatientMedicalNotes = {
            personal_details: {
                name: "",
                gender: ""
            },
            chief_complaint: {
                presenting_complaints: "",
                hpc: {
                    // site: "",
                    // onset: "",
                    // character: "",
                    // exerbating_and_relieving_factors: {
                    //     exacerbating_factors: "",
                    //     relieving_factors: ""
                    // },
                    // severity: ""
                    summary: ""
                },
                additional_info: ""
            },
            medical_history: {
                general: {
                    previous_illnesses: []
                },
                critical_conditions: []
            },
            systemic_enquiry: {
                appetite_weight_changes: "",
                gastrointestinal_symptoms: [""],
                musculoskeletal_issues: "",
                neurological_symptoms: "",
                psychological_symptoms: "",
                respiratory_symptoms: [""],
                sexual_health: "",
                urinary_issues: ""
            },
            drug_and_allergy: {},
            family_history: {},
            social_history: {
                marital_status: "",
                occupation: ""
            }
        }

        //Helper function to extract value btn delimeters
        function extractValue(str: string, key: string): string {
            const regex = new RegExp(`\\\\${key}\\\\([^\\\\]+)`)
            const match = regex.exec(str)
            return match ? match[1].trim() : ""
            //Handle different possible patterns
        }

        //extract personal_details
        result.personal_details.name = extractValue(cleanInput, "name")
        result.personal_details.gender = extractValue(cleanInput, "gender")

        //extract chief_complaint
        result.chief_complaint.presenting_complaints = extractValue(cleanInput, "presenting_complaints")
        // result.chief_complaint.hpc.site = extractValue(cleanInput, "site")
        // result.chief_complaint.hpc.onset = extractValue(cleanInput, "onset")
        // result.chief_complaint.hpc.character = extractValue(cleanInput, "character")
        // result.chief_complaint.hpc.exerbating_and_relieving_factors.exacerbating_factors = extractValue(
        //     cleanInput,
        //     "exacerbating_factors"
        // )
        // result.chief_complaint.hpc.exerbating_and_relieving_factors.relieving_factors = extractValue(
        //     cleanInput,
        //     "relieving_factors"
        // )
        // result.chief_complaint.hpc.severity = extractValue(cleanInput, "severity")

        //extract medical_history
        result.medical_history.general.previous_illnesses = extractValue(cleanInput, "previous_illnesses")
        result.medical_history.critical_conditions = extractValue(cleanInput, "critical_conditions")

        //extract systemic_enquiry
        result.systemic_enquiry = extractValue(cleanInput, "systemic_enquiry") as any

        //extract drug_and_allergy
        result.drug_and_allergy = extractValue(cleanInput, "drug_and_allergy")

        //extract family_history
        result.family_history = extractValue(cleanInput, "family_history")

        //extract social_history
        result.social_history.marital_status = extractValue(cleanInput, "marital_status")
        result.social_history.occupation = extractValue(cleanInput, "occupation")

        return result
    } catch (error) {
        console.error("Error parsing patient medical notes:", error)
        return null
    }
}
*/

export const getPreviousConversationWithPatients = async () => {
    const url = BACKEND_BASE_URL + "/doc-patient/history/transcripts"
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    if (response.status === 401) {
        signOut()
    }
    return response
}

export const getTranscriptDetails = async (jobId: string) => {
    const url = BACKEND_BASE_URL + "/doc-patient/history/transcripts/" + jobId
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    if (response.status === 401) {
        signOut()
    }
    return response
}

export const downloadAudioMessage = async (audioId: string) => {
    const url = BACKEND_BASE_URL + "/patient/audio/download/" + audioId
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

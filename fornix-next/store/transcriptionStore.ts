import { create } from "zustand"
import {
    uploadAudioRecording,
    transcribe,
    generateReport,
    checkJobStatus,
    processStreamResponse,
    parseTranscript
} from "@/services/dashboard/patient_history.service"
import { PatientMedicalNotes, Message } from "@/utils/types"
import { useAudioStore } from "./AudioStore"
import usePatientTranscriptStore from "./Doc-patient-transcript"

interface TranscriptionState {
    isLoading: boolean
    error: string | null
    uploadId: string | null
    jobId: string | null
    stateMessage:
        | "Uploading..."
        | "Transcribing..."
        | "Generating Report..."
        | "Checking Job Status..."
        | "Retrying..."
        | "Done"
        | null
    medicalNotes: PatientMedicalNotes | null
    transcribedConversation: Message[] | null
    uploadRecording: (audioBlob: Blob) => Promise<string | null>
    transcribe: (uploadedAudioId: string) => Promise<string | null>
    generateFormattedReport: (jobid: string) => Promise<string | void>
    checkJobIdStatus: (jobid: string) => Promise<string | null>
    transcribeAndGenerateReport: () => Promise<string | void>
    retry: () => Promise<void>
}

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
    isLoading: false,
    error: null,
    uploadId: null,
    jobId: null,
    stateMessage: null,
    medicalNotes: null,
    transcribedConversation: null,
    uploadRecording: async (audioBlob: Blob) => {
        set({ isLoading: true, stateMessage: "Uploading...", error: null })
        try {
            const { res, uploadErr } = await uploadAudioRecording(audioBlob)
            if (uploadErr) {
                set({ isLoading: false, stateMessage: null, error: uploadErr })
                return null
            }
            set({ isLoading: false, stateMessage: "Done", uploadId: await res.upload_id })
            return res.upload_id
        } catch (error) {
            set({ isLoading: false, error: "An error occurred" })
            console.error(error)
        }
    },
    transcribe: async (uploadedAudioId: string) => {
        set({ isLoading: true, stateMessage: "Transcribing...", error: null })
        try {
            const { res, transcribeErr } = await transcribe(uploadedAudioId)
            if (transcribeErr) {
                set({ isLoading: false, stateMessage: null, error: transcribeErr })
                return null
            }
            set({ isLoading: false, stateMessage: "Done", jobId: await res.job_id })
            return res.job_id
        } catch (error) {
            set({ isLoading: false, stateMessage: null, error: "An error occurred" })
            console.error(error)
        }
    },
    generateFormattedReport: async (jobid): Promise<string | undefined> => {
        set({ isLoading: true, stateMessage: "Generating Report...", error: null })
        try {
            const rawReport = await generateReport(jobid)
            //proccess the report to separate transcript from medical notes
            if (!rawReport) {
                set({ isLoading: false, stateMessage: null, error: "An error occurred when generating report" })
                return
            }

            const processedReport = processStreamResponse(rawReport)
            console.log("processed report", processedReport)

            if (!processedReport || !processedReport.raw_transcript || !processedReport.medical_notes) {
                set({ isLoading: false, stateMessage: null, error: "An error occurred when generating report" })
                return
            }
            set({
                isLoading: false,
                stateMessage: "Done",
                transcribedConversation: parseTranscript(processedReport.raw_transcript.transcript),
                medicalNotes: processedReport.medical_notes
            })
            //revalidate transcripts history fetch
            const revalidateTranscriptsHistory = usePatientTranscriptStore.getState().fetchTranscripts
            if (get().stateMessage == "Done") {
                console.log("it's working")
                revalidateTranscriptsHistory()
            }
            return processedReport.raw_transcript.id
        } catch (error) {
            console.error(error)
            set({ isLoading: false, stateMessage: null, error: "An error occurred when generating report" })
        }
    },
    checkJobIdStatus: async (jobid: string) => {
        set({ isLoading: true, stateMessage: "Checking Job Status...", error: null })
        try {
            const status = await checkJobStatus(jobid)
            return status
        } catch (error) {
            set({ isLoading: false, stateMessage: null, error: "An error occurred" })
            console.error(error)
        }
    },
    transcribeAndGenerateReport: async () => {
        try {
            const audioBlobFile = useAudioStore.getState().audioBlob
            if (audioBlobFile) {
                const upload_Id = await get().uploadRecording(audioBlobFile)
                if (!upload_Id) {
                    set({ isLoading: false, stateMessage: null })
                    return
                }
                const job_Id = await get().transcribe(upload_Id)
                if (!job_Id) {
                    set({ isLoading: false, stateMessage: null })
                    return
                }
                get().generateFormattedReport(job_Id)
                return job_Id
            }
        } catch (error) {
            set({ isLoading: false, stateMessage: null, error: "An error occurred" })
            console.error(error)
        }
    },
    retry: async () => {
        //check if we have a job id
        const audioBlobFile = useAudioStore.getState().audioBlob
        const id = get().jobId
        if (id) {
            const { status } = await checkJobStatus(id)

            console.log("This is the Job status", status)
            if (status !== "completed" && audioBlobFile) {
                await get().transcribeAndGenerateReport()
            }
            await get().generateFormattedReport(id)
        } else {
            if (!audioBlobFile) {
                set({ isLoading: false, stateMessage: null, error: "There's no recording to upload" })
                return
            }
            await get().transcribeAndGenerateReport()
        }
    }
}))

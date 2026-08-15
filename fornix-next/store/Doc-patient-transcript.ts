import {
    getPreviousConversationWithPatients,
    getTranscriptDetails,
    parseTranscript
} from "@/services/dashboard/patient_history.service"
import { create } from "zustand"
import { useTranscriptionStore } from "./transcriptionStore"

interface PatientTranscriptState {
    transcripts: TranscriptRes[]
    transcriptMedicalNotes: [] | null
    transcriptConversation: [] | null
    error: string | null
    fetchTranscripts: () => Promise<void>
    fetchTranscript: (id: string) => void
    selectedTranscriptId: string | null
    setSelectedTranscriptId: (id: string) => void
    fetchTranscriptError: string | null
}

type TranscriptRes = {
    created_at: string
    error: string | null
    id: string
    name: string
    status: string
    task: string
    updated_at: string
    upload_id: string
}

const usePatientTranscriptStore = create<PatientTranscriptState>(set => ({
    transcripts: [],
    transcriptMedicalNotes: null,
    transcriptConversation: null,
    error: null,
    selectedTranscriptId: null,
    fetchTranscriptError: null,
    removeTranscript: (index: number) =>
        set(state => ({
            transcripts: state.transcripts.filter((_, i) => i !== index)
        })),
    fetchTranscripts: async () => {
        console.log("Here we go again: ")
        try {
            const response = await getPreviousConversationWithPatients()
            const data = await response.json()
            data.reverse()
            set({ transcripts: data, error: null })
        } catch (error) {
            set({ error: "Failed to fetch transcripts" })
        }
    },
    fetchTranscript: async (id: string) => {
        try {
            const response = await getTranscriptDetails(id)
            const data = await response.json()
            useTranscriptionStore.setState({ transcribedConversation: parseTranscript(data?.transcript) })
            useTranscriptionStore.setState({ medicalNotes: data?.medical_notes })
        } catch (error) {
            useTranscriptionStore.setState({ error: "Failed to load transcript" })
        }
    },
    setSelectedTranscriptId: (id: string) => set({ selectedTranscriptId: id })
}))
export default usePatientTranscriptStore

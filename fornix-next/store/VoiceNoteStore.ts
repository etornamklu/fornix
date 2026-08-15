// store/useVoiceNoteStore.ts
import { create } from "zustand"

interface VoiceNoteState {
    audioBlob: Blob | null
    audioUrl: string | null
    recordingDuration: number
    isPlaying: boolean

    // Actions
    setAudioBlob: (blob: Blob) => void
    setAudioUrl: (url: string) => void
    setRecordingDuration: (duration: number) => void
    setIsPlaying: (isPlaying: boolean) => void
    resetVoiceNote: () => void
}

export const useVoiceNoteStore = create<VoiceNoteState>(set => ({
    audioBlob: null,
    audioUrl: null,
    recordingDuration: 0,
    isPlaying: false,

    setAudioBlob: blob => set({ audioBlob: blob }),
    setAudioUrl: url => set({ audioUrl: url }),
    setRecordingDuration: duration => set({ recordingDuration: duration }),
    setIsPlaying: isPlaying => set({ isPlaying }),
    resetVoiceNote: () =>
        set({
            audioBlob: null,
            audioUrl: null,
            recordingDuration: 0,
            isPlaying: false
        })
}))

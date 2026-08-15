// store/audioStore.ts
import { create } from "zustand"

interface AudioMessagesStore {
    // We'll store the audio messages as data URL strings.
    audioMessages: Record<string, string>
    // The function accepts a Blob and converts it to a data URL before storing.
    addAudioMessage: (audioId: string, audioBlob: Blob) => Promise<void>
    // Returns the audio as a Blob (converted from the stored data URL)
    getAudioMessage: (audioId: string) => Blob | null
    removeAudioMessage: (audioId: string) => void
    clearAudioMessages: () => void

    // Add method to create a local audio message ID
    createLocalAudioId: () => string
    // Check if an ID is for a local audio message
    isLocalAudioMessage: (audioId: string) => boolean
}

// Helper to convert a Blob to a data URL string.
function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = err => reject(err)
        reader.readAsDataURL(blob)
    })
}

// Helper to convert a data URL string back into a Blob.
function dataURLToBlob(dataURL: string): Blob {
    const [header, base64Data] = dataURL.split(",")
    const mimeMatch = header.match(/:(.*?);/)
    if (!mimeMatch) {
        throw new Error("Invalid data URL")
    }
    const mime = mimeMatch[1]
    const binary = atob(base64Data)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i)
    }
    return new Blob([array], { type: mime })
}

export const useAudioMessagesStore = create<AudioMessagesStore>()((set, get) => ({
    audioMessages: {},
    addAudioMessage: async (audioId: string, audioBlob: Blob) => {
        const dataUrl = await blobToDataURL(audioBlob)
        set(state => ({
            audioMessages: { ...state.audioMessages, [audioId]: dataUrl }
        }))
    },
    getAudioMessage: (audioId: string) => {
        const dataUrl = get().audioMessages[audioId]
        return dataUrl ? dataURLToBlob(dataUrl) : null
    },
    removeAudioMessage: (audioId: string) => {
        set(state => {
            const updatedMessages = { ...state.audioMessages }
            delete updatedMessages[audioId]
            return { audioMessages: updatedMessages }
        })
    },
    clearAudioMessages: () => {
        set({ audioMessages: {} })
    },
    createLocalAudioId: () => `local_${Date.now()}`,
    isLocalAudioMessage: (audioId: string) => audioId.startsWith("local_")
}))

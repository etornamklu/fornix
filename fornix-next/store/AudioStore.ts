import { create } from "zustand";

interface AudioState {
    audioBlob: Blob | null; 
    setAudioBlob: (blob: Blob) => void;
    //clear audio Blob
    clearAudioBlob: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
    audioBlob: null, 
    setAudioBlob: (blob: Blob) => set({ audioBlob: blob }),
    clearAudioBlob : () => {
       set({ audioBlob: null });  
    },
}));

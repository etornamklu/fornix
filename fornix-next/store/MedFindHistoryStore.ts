import { MedFindHistoryItem } from "@/utils/types"
import { create } from "zustand"
import { getDoctorMedFindThreads } from "@/services/dashboard/threads.service"

type MedFindHistoryStore = {
    medFindHistoryList: MedFindHistoryItem[]
    setMedFindHistoryList: (medFindHistoryList: MedFindHistoryItem[]) => void
    resetMedFindHistoryList: () => void
    updateMedFindHistoryList: () => void
    updateMedFindHistoryName: (session_id: string, newName: string) => void
}

const useMedFindHistoryStore = create<MedFindHistoryStore>(set => ({
    medFindHistoryList: [],
    setMedFindHistoryList: medFindHistoryList =>
        set(state => ({
            medFindHistoryList: medFindHistoryList ?? state.medFindHistoryList
        })),
    resetMedFindHistoryList: () =>
        set(() => ({
            medFindHistoryList: []
        })),
    updateMedFindHistoryList: async () => {
        try {
            const data = await getDoctorMedFindThreads()
            if (!data) return
            set(() => ({ medFindHistoryList: data }))
        } catch (error) {
            console.error("Failed to update MedFind history list:", error)
        }
    },
    updateMedFindHistoryName: (session_id, newName) =>
        set(state => ({
            medFindHistoryList: state.medFindHistoryList.map(item =>
                item.session_id === session_id ? { ...item, name: newName } : item
            )
        }))
}))

export default useMedFindHistoryStore

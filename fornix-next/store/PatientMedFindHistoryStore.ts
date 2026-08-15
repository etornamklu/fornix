import { PatientMedFindHistoryItem, PatientsGptRequestProps } from "@/utils/types"
import { create } from "zustand"
import { getPatientMedFindThreads } from "@/services/dashboard/threads.service"

type PatientMedFindHistoryStore = {
    patientmedFindHistoryList: PatientMedFindHistoryItem[]
    setpatientMedFindHistoryList: (medFindHistoryList: PatientMedFindHistoryItem[]) => void
    resetpatientMedFindHistoryList: () => void
    updatepatientMedFindHistoryList: () => void
}

const usePatientMedFindHistoryStore = create<PatientMedFindHistoryStore>(set => ({
    patientmedFindHistoryList: [],

    setpatientMedFindHistoryList: patientmedFindHistoryList =>
        set(state => ({
            patientmedFindHistoryList: patientmedFindHistoryList ?? state.patientmedFindHistoryList
        })),

    resetpatientMedFindHistoryList: () =>
        set(() => ({
            patientmedFindHistoryList: []
        })),

    updatepatientMedFindHistoryList: async () => {
        try {
            const data = await getPatientMedFindThreads()
            // console.log("Fetcehd Chat History:", data)
            if (!data) return

            set(() => ({ patientmedFindHistoryList: data }))
        } catch (error) {
            console.error("Error fetching chat history:", error)
        }
    }
}))

export default usePatientMedFindHistoryStore

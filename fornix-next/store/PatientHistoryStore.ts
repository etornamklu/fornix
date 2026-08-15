import { DoctorDashboardDiagnosis } from "@/utils/types"
import { create } from "zustand"
import { getAllDiagnoses } from "@/services/dashboard/patient_history.service"

type PatientHistoryStore = {
    patientHistoryList: DoctorDashboardDiagnosis[]
    setPatientHistoryList: (patientHistoryList: DoctorDashboardDiagnosis[]) => void
    resetPatientHistoryList: () => void
    updatePatientHistoryList: () => void
}

const usePatientHistoryStore = create<PatientHistoryStore>(set => ({
    patientHistoryList: [],
    setPatientHistoryList: patientHistoryList =>
        set(state => ({
            patientHistoryList: patientHistoryList ?? state.setPatientHistoryList
        })),
    resetPatientHistoryList: () => set(() => ({ patientHistoryList: [] })),
    updatePatientHistoryList: async () => {
        try {
            const diagnosesList = await getAllDiagnoses()
            if (!diagnosesList) return
            set(() => ({ patientHistoryList: diagnosesList }))
        } catch (error) {}
    }
}))

export default usePatientHistoryStore

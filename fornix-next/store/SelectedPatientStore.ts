import { UserConnectionsUser } from "@/utils/types"
import { create } from "zustand"

interface PatientState {
    selectedPatient: UserConnectionsUser | null
    setSelectedPatient: (patient: UserConnectionsUser | null) => void
    clearSelectedPatient: () => void
}

export const useSelectedPatientStore = create<PatientState>(set => ({
    selectedPatient: null,
    setSelectedPatient: patient => set({ selectedPatient: patient }),
    clearSelectedPatient: () => set({ selectedPatient: null })
}))

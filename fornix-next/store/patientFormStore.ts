import { create } from "zustand"

interface PatientFormState {
    name: string
    age: string
    gender: string
    address: string
    setFormData: (name: string, age: string, gender: string, address: string) => void
    clearForm: () => void
}

export const usePatientFormStore = create<PatientFormState>(set => ({
    name: "",
    age: "",
    gender: "",
    address: "",
    setFormData: (name: string, age: string, gender: string, address: string) => set({ name, age, gender, address }),
    clearForm: () => set({ name: "", age: "", gender: "", address: "" })
}))

import { create } from "zustand"

interface ConversationPageRouteState {
    step: number
    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
}

const useConversationPageRouteStore = create<ConversationPageRouteState>(set => ({
    step: 0,
    setStep: step => set({ step }),
    nextStep: () => set(state => ({ step: state.step + 1 })),
    prevStep: () => set(state => ({ step: state.step > 0 ? state.step - 1 : 0 }))
}))

export default useConversationPageRouteStore

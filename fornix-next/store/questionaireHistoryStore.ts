import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getPatientChatHistory, getPatientQuestionnaireHistory } from "@/services/dashboard/patient_history.service"
import { getUserData } from "@/utils/auth.server"
import { QuestionnaireHistoryType } from "@/utils/types"

interface FormattedItem {
    question: string
    answer: string
}

interface QuestionnaireHistoryState {
    isLoading: boolean
    error: string | null
    questionnaires: FormattedItem[] | null
    questionnaireId: string | null
    patientName: string | null
    previousConversations: QuestionnaireHistoryType[] | null
    fetchQuestionnaireHistory: (questionnaireId: string) => Promise<void>
    setQuestionnaireId: (id: string) => void
    getPatientName: () => Promise<void>
    getPreviousConversationsList: () => Promise<void>
}

const formatResponses = (chatData: any): FormattedItem[] => {
    const questionAnswerPairs = []
    let currentQuestion = ""
    let currentAnswer = ""

    for (let i = 0; i < chatData?.length; i++) {
        const entry = chatData[i]

        if (i === 0) {
            currentQuestion = `Hello! I’m Fornix AI, your doctor’s assistant. To help your clinician understand your condition better, I’d like to ask a few questions about your symptoms and medical history.\n\nThis will make your consultation smoother and more efficient. You can stop at any time, and if anything is unclear, feel free to ask me for clarification.\n\nDo I have your permission to continue?`
        }

        if (entry.type === "ai") {
            if (currentQuestion !== "") {
                questionAnswerPairs.push({
                    question: currentQuestion,
                    answer: ""
                })
            }
            currentQuestion = entry.content
            currentAnswer = ""
        } else if (entry.type === "human") {
            const isVoiceNote = entry.additional_kwargs.input === "audio"
            if (currentQuestion === "") {
                questionAnswerPairs.push({
                    question: "",
                    answer: isVoiceNote ? "#!AUDIO_MSG:" + entry.additional_kwargs.audio_id : entry.content
                })
            } else {
                questionAnswerPairs.push({
                    question: currentQuestion,
                    answer: isVoiceNote ? "#!AUDIO_MSG:" + entry.additional_kwargs.audio_id : entry.content
                })
                currentQuestion = ""
                currentAnswer = ""
            }
        }
    }

    if (currentQuestion !== "") {
        questionAnswerPairs.push({ question: currentQuestion, answer: "" })
    }

    return questionAnswerPairs
}

const initialState = {
    isLoading: false,
    error: null,
    questionnaires: null,
    questionnaireId: "0",
    patientName: null,
    previousConversations: null
}

// Define the store mutator tuple for persist.
// Note: The key string must match the one used internally by zustand persist.
type PersistMutators = [["zustand/persist", { questionnaireId: string | null }]]

export const useQuestionnaireHistoryStore = create<QuestionnaireHistoryState, PersistMutators>(
    persist(
        (set, get) => ({
            ...initialState,
            fetchQuestionnaireHistory: async (questionnaireId: string) => {
                set({ isLoading: true, error: null })
                try {
                    const res = await getPatientChatHistory(questionnaireId)
                    const data = formatResponses(await res)
                    set({ questionnaires: data, isLoading: false, error: null })
                } catch (error: any) {
                    console.error(error)
                    set({ error: error?.message, isLoading: false })
                }
            },
            setQuestionnaireId: (questionnaireId: string) => set({ questionnaireId }),
            getPatientName: async () => {
                const { name } = await getUserData()
                if (name) {
                    set({ patientName: name })
                }
            },
            getPreviousConversationsList: async () => {
                const previousConversations = await getPatientQuestionnaireHistory()
                set({ previousConversations })
            }
        }),
        {
            name: "questionnaire-history", // key in localStorage
            partialize: state => ({ questionnaireId: state.questionnaireId })
        }
    )
)

import { create } from "zustand"
import { authDefault, AuthType } from "@/utils/types"
import { getDoctorData } from "@/services/auth/auth.service"
import { signOut } from "next-auth/react"

type AuthStore = {
    auth: AuthType
    setAuth: (auth: Partial<AuthType>) => void // Allow partial updates
    resetAuth: () => void
    updateAuth: () => void
}

const useAuthStore = create<AuthStore>(set => ({
    auth: authDefault,
    setAuth: auth =>
        set(state => ({
            auth: { ...state.auth, ...auth }
        })),
    resetAuth: () =>
        set(() => ({
            auth: authDefault
        })),
    updateAuth: async () => {
        try {
            const doctor = await getDoctorData()
            if (doctor && doctor.value) {
                const docJson = JSON.parse(doctor.value)
                set(() => ({
                    auth: {
                        name: docJson.name,
                        email: docJson.email,
                        id: docJson.id,
                        role: docJson.role,
                        free_trial: docJson.free_trial,
                        credits: docJson.credits,
                        profile_picture_url: docJson.profile_picture_url,
                        user_code: docJson.user_code,
                        organization_id: docJson.organization_id
                    }
                }))
            } else {
                signOut()
            }
        } catch (error) {}
    }
}))

export default useAuthStore

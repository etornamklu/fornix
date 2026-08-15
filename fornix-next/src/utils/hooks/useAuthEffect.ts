import { Dispatch, SetStateAction, useEffect } from "react"
import { getDoctorData } from "@/services/auth/auth.service"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const useAuthEffect = (setAuth: Dispatch<SetStateAction<any>>) => {
    const router = useRouter()

    const fetchData = async () => {
        // console.log('running fetch data')
        try {
            const doctor = await getDoctorData()
            // console.log(doctor)
            if (doctor && doctor.value) {
                const docJson = JSON.parse(doctor.value)
                setAuth({
                    name: docJson.name,
                    email: docJson.email,
                    id: docJson.id,
                    role: docJson.role,
                    free_trial: docJson.free_trial,
                    credits: docJson.credits,
                    profile_picture_url: docJson.profile_picture_url,
                    user_code: docJson.user_code,
                    organization_id: docJson.organization_id
                })

                if (!docJson.free_trial && docJson.credits === 0) {
                    router.push("/profile-setup")
                }
            } else {
                signOut()
                router.push("/auth/signin")
            }
        } catch (error) {
            console.error("Error fetching doctor data:", error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return fetchData
}

export default useAuthEffect

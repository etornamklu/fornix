import {getDoctorData} from "@/services/auth/auth.service";
import Cookies from 'js-cookie'

export const updateUserCredits = async (responseCredits: string) => {
    try {
        // const Cookies = cookies()
        const userCookie = await getDoctorData()

        if (responseCredits && userCookie?.value) {
            const userJson = JSON.parse(userCookie.value)
            userJson.credits = Number(responseCredits)
            Cookies.set('doctor', JSON.stringify(userJson))
            // window.dispatchEvent(new Event('storage'))
        }
    } catch (err) {
        console.log(err)
    }
}

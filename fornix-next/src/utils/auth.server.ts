"use server"
import {cookies} from "next/headers";

export const getBearerToken = async () => {
    const Cookies = cookies()
    const token = Cookies.get('access-token')?.value
    return token ? token : null
}

export const getUserData = async () => {
    const patient = cookies().get('doctor')?.value
    return patient? JSON.parse(patient) : null
}
"use server"

import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { cookies } from "next/headers"

const allowedAmounts = [10000, 20000, 5000]

export const updateUserPaymentInfo = async (reference?: any, amount?: number) => {
    // send the ref over to the backend.
    // backend performs necessary updates and returns updated user data
    // if (!allowedAmounts.includes(amount)) {
    //     throw new Error(`Invalid amount. Please choose from ${allowedAmounts.join(", ")}.`)
    // }

    const url = BACKEND_BASE_URL + "/payment/"
    const bearerToken = await getBearerToken()

    const response = await fetch(url, {
        method: "POST",
        // body: JSON.stringify({
        //     reference: reference.reference,
        //     transaction: reference.transaction,
        //     trxref: reference.trxref,
        //     amount: amount
        // }),
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json"
        }
    })

    if (!response.ok || response.status !== 201) {
        // handle other statuses later
        return { data: null, doctor: null }
    }

    const { data, doctor } = await response.json()

    const Cookies = cookies()
    Cookies.set("doctor", JSON.stringify(doctor))

    return { data, doctor }
}

export const startFreeTrial = async () => {
    const url = BACKEND_BASE_URL + "/payment/free"
    const bearerToken = await getBearerToken()

    const resp = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    })

    const { doctor } = await resp.json()

    const Cookies = cookies()
    Cookies.set("doctor", JSON.stringify(doctor))

    return resp.status === 200
}

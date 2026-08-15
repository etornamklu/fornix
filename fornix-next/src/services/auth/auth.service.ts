"use server"
import { cookies } from "next/headers"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { signOut } from "next-auth/react"

const setDoctorCookie = (user: any) => {
    const Cookies = cookies()
    Cookies.set("doctor", JSON.stringify(user))
}

export const deleteGoogleTokenCookie = async () => {
    cookies().delete("google_token")
}

export const extractAccessToken = async (headerData: any): Promise<string | undefined> => {
    const setCookieHeader: string | null = headerData.get("set-cookie")

    if (setCookieHeader) {
        // Find and extract the 'access-token' from the cookies
        const cookies = setCookieHeader.split(";")
        let accessToken = ""
        cookies.forEach(cookie => {
            if (cookie.trim().startsWith("access-token=")) {
                accessToken = cookie.trim().substring("access-token=".length)
            }
        })

        return accessToken
    }
}

export const SignUp = async (name: string, email: string, password: string) => {
    try {
        // send request to server
        const response = await fetch(BACKEND_BASE_URL + "/auth/sign_up", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
            headers: {
                "Content-Type": "application/json"
            }
        })

        if (!response.ok) {
            console.log("Error registering user")
            return response
        }

        const token = await extractAccessToken(response.headers)
        if (token) {
            cookies().set("access-token", token, { httpOnly: true })
        }

        return response
    } catch (e) {
        console.log({ e })
        return null
    }
}

export const SignIn = async (email: string, password: string) => {
    try {
        const authResp = await fetch(BACKEND_BASE_URL + "/auth", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: {
                "Content-Type": "application/json"
            }
        })

        if (authResp.status !== 200) {
            // failed login
            console.log("login failed")
            return null
        }

        const accessToken = await extractAccessToken(authResp.headers)
        if (accessToken) {
            cookies().set("access-token", accessToken, { httpOnly: true })
        }

        console.log("login on backend success")
        // keep token in cookie
        const { user } = await authResp.json()
        setDoctorCookie(user)

        return { doctor: user }
    } catch (e) {
        console.log(e)
    }
}

export const GoogleSignInCallback = async (token: string) => {
    const response = await fetch(BACKEND_BASE_URL + "/auth/google", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })

    if (response.status === 401) {
        console.log("flaged")
        return {
            linkAccountRequired: true
        }
    }

    if (response.ok) {
        // store user data
        const accessToken = await extractAccessToken(response.headers)
        if (accessToken) {
            cookies().set("access-token", accessToken, { httpOnly: true })
        }
        const { user } = await response.json()
        setDoctorCookie(user)

        return { doctor: user }
    } else {
        // handle failure
        console.log(response.status)
        console.log(response.json())
        return null
    }
}

export const LinkAccounts = async (googleToken: string) => {
    try {
        const response = await fetch(BACKEND_BASE_URL + "/auth/link_google_account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                google_token: googleToken
            })
        })

        if (!response.ok) {
            return { error: "Linking user account failed" }
        }

        const accessToken = await extractAccessToken(response.headers)
        if (accessToken) {
            cookies().set("access-token", accessToken, { httpOnly: true })
        }

        const { user } = await response.json()
        setDoctorCookie(user)

        return { user }
    } catch (e) {
        console.log(e)
        return e
    }
}

export const updateUserRole = async (role: string) => {
    const user = await getDoctorData()
    let userId = ""
    if (user && user.value) {
        userId = (JSON.parse(user.value) as any).id
    }

    if (!userId) {
        console.log("null user id")
        console.log(user)
        console.log(userId)
    }

    try {
        const roleResp = await fetch(BACKEND_BASE_URL + `/auth/set-role`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${await getBearerToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ role })
        })

        if (roleResp.status !== 200) {
            console.log(roleResp.status)
        }

        if (roleResp.status === 200) {
            const accessToken = await extractAccessToken(roleResp.headers)
            if (accessToken) {
                cookies().set("access-token", accessToken, { httpOnly: true })
            }
            const { data } = await roleResp.json()
            setDoctorCookie(data)
        }

        return { status: roleResp.status, success: roleResp.status === 200 }
    } catch (e) {
        console.log(e)
    }
}

export const getDoctorData = async () => {
    try {
        const Cookies = cookies()
        const doctor = Cookies.get("doctor")

        if (!doctor) return null
        return doctor
    } catch (e) {
        console.log(e)
    }
}

export const requestPasswordResetLink = async (email: string) => {
    try {
        const resetResp = await fetch(BACKEND_BASE_URL + `/auth/password/reset`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        })

        return resetResp.status === 200
    } catch (e) {
        console.log(e)
        return false
    }
}

export const updateUserName = async (new_name: string) => {
    try {
        const updateNameResp = await fetch(BACKEND_BASE_URL + `/auth/update_name`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${await getBearerToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ new_name })
        })

        if (updateNameResp.status !== 200) return updateNameResp.status

        const data = await updateNameResp.json()
        setDoctorCookie(data.data)
    } catch (err) {
        console.log(err)
        return 500
    }
}

export const logout = async () => {
    signOut()
    const Cookies = cookies()
    Cookies.delete("doctor")
    Cookies.delete("access-token")
}

export const deleteAccount = async (email: string, password?: string) => {
    try {
        console.log("Deleting account with:", { email, password })
        const authResp = await fetch(BACKEND_BASE_URL + "/auth/delete", {
            method: "DELETE",
            body: JSON.stringify({ email, password }),
            headers: {
                Authorization: `Bearer ${await getBearerToken()}`,
                "Content-Type": "application/json"
            }
        })

        if (authResp.status === 200) {
            // // Account successfully deleted
            // console.log("Account deleted successfully");
            // // Clear user-related cookies
            // logout();
            // return {success: true, message: "Account deleted successfully"};

            signOut()
            return { success: true, message: "Account deleted" }
        } else {
            const errorData = await authResp.json()
            console.error("Error deleting account:", errorData)
            return { success: false, message: errorData.message || "Failed to delete account" }
        }
    } catch (error) {
        console.error("Error occurred while deleting the account:", error)
        return { success: false, message: "An error occurred while deleting the account" }
    }
}

export const setOrganizationIdInCookie = async (organizationId: string) => {
    const Cookies = cookies()
    const doctor = Cookies.get("doctor") //doctor cos it started as just doctor but it is still any role
    if (!doctor?.value) return

    try {
        const parsed = JSON.parse(doctor.value)
        const updated = { ...parsed, organization_id: organizationId }
        Cookies.set("doctor", JSON.stringify(updated))
    } catch {}
}

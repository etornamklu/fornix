import { NextResponse } from "next/server"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"

export async function GET() {
    try {
        const token = await getBearerToken()
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const backendResponse = await fetch(`${BACKEND_BASE_URL}/organization/users`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const text = await backendResponse.text()
        const headers = new Headers(backendResponse.headers)
        return new NextResponse(text, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers
        })
    } catch (error) {
        console.error("Error proxying organization users:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}


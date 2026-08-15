import { NextRequest, NextResponse } from "next/server"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"

export async function GET() {
    try {
        const token = await getBearerToken()
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const backendResponse = await fetch(`${BACKEND_BASE_URL}/organization`, {
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
        console.error("Error proxying organization fetch:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await getBearerToken()
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await request.json()

        const backendResponse = await fetch(`${BACKEND_BASE_URL}/organization`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })

        const text = await backendResponse.text()

        // Log backend response for debugging
        console.log("Backend response status:", backendResponse.status)
        console.log("Backend response text:", text)

        // Forward backend headers (including Set-Cookie) to the client
        const headers = new Headers(backendResponse.headers)
        return new NextResponse(text, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers
        })
    } catch (error) {
        console.error("Error proxying organization creation:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { BACKEND_BASE_URL } from "@/utils/constants"
import { getBearerToken } from "@/utils/auth.server"

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const token = await getBearerToken()
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const backendResponse = await fetch(`${BACKEND_BASE_URL}/organization/users/${params.userId}`, {
            method: "DELETE",
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
        console.error("Error proxying delete organization user:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const token = await getBearerToken()
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await request.json()

        const backendResponse = await fetch(`${BACKEND_BASE_URL}/organization/users/${params.userId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })

        const text = await backendResponse.text()
        const headers = new Headers(backendResponse.headers)
        return new NextResponse(text, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers
        })
    } catch (error) {
        console.error("Error proxying update organization user:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

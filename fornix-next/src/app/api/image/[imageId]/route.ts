import { NextRequest, NextResponse } from "next/server"
import { getBearerToken } from "@/utils/auth.server"
import { BACKEND_BASE_URL } from "@/utils/constants"

export async function GET(request: NextRequest, { params }: { params: { imageId: string } }) {
    try {
        const { imageId } = params
        const token = await getBearerToken()

        if (!token) {
            return NextResponse.json({ error: "No authentication token available" }, { status: 401 })
        }

        const response = await fetch(`${BACKEND_BASE_URL}/image/download/${imageId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.status === 200) {
            const imageBuffer = await response.arrayBuffer()
            const contentType = response.headers.get("content-type") || "image/jpeg"

            return new NextResponse(imageBuffer, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=31536000"
                }
            })
        }

        if (response.status === 401) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
        }

        return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status })
    } catch (error) {
        console.error("Error fetching image:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextResponse } from "next/server"

export async function POST() {
    const response = NextResponse.json({ success: true })
    // Expire cookies on this domain
    response.cookies.set("doctor", "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0)
    })
    response.cookies.set("access-token", "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0)
    })
    return response
}

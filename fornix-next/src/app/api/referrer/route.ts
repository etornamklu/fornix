import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const allowedReferrers = ["fornix", "localhost"]

    const requestedWith = req.headers.get("x-requested-with") || null
    const refererHeader = req.headers.get("referer") || null
    let referrer = refererHeader

    if (refererHeader) {
        try {
            const url = new URL(refererHeader)
            // console.log(url)
            // Check if the hostname includes any of the allowed referrers.
            if (allowedReferrers.some(allowed => url.hostname.includes(allowed))) {
                referrer = null
            }
        } catch (error) {
            console.error("Error parsing referer URL:", error)
            // If parsing fails, default to keeping the original referer value.
            referrer = refererHeader
        }
    }

    console.log(`reqwith ${requestedWith}`)
    console.log(`ref ${referrer}`)
    // console.log(req.headers)
    return NextResponse.json({ "x-requested-with": requestedWith, referer: referrer })
}

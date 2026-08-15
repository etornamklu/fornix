import { NextResponse } from "next/server"
import { setOrganizationIdInCookie } from "@/services/auth/auth.service"

export async function POST(request: Request) {
    try {
        const { organization_id } = await request.json()
        if (!organization_id) {
            return NextResponse.json({ error: "Organization id is required" }, { status: 400 })
        }

        await setOrganizationIdInCookie(organization_id)
        return NextResponse.json({ success: true }, { status: 200 })
    } catch (e) {
        return NextResponse.json({ error: "Failed to update cookie" }, { status: 500 })
    }
}

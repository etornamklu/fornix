import {NextResponse} from "next/server";
import {BACKEND_BASE_URL} from "@/utils/constants";

export async function POST(request: Request) {
    try {
        const {password, password_reset_token} = await request.json()

        return await fetch(`${BACKEND_BASE_URL}/auth/password/reset`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                password,
                password_reset_token
            }),
        })
    } catch (e) {
        console.log({e})
        return NextResponse.json({error: e})
    }
}
import {NextResponse} from "next/server";
import {BACKEND_BASE_URL} from "@/utils/constants";
import {getBearerToken} from "@/utils/auth.server";

export async function POST(request: Request) {
    try {
        const {old_password, new_password} = await request.json()
        const bearerToken = await getBearerToken()

        return await fetch(`${BACKEND_BASE_URL}/auth/password/change`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${bearerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                old_password,
                new_password
            })
        })
    } catch (err) {
        console.log(err)
        return NextResponse.json({error: err}, {status: 500})
    }
}
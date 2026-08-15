import {NextResponse} from "next/server";
import {SignUp} from "@/services/auth/auth.service";

export async function POST(request: Request) {
    try {
        const {name, email, password} = await request.json()
        // console.log({name, email, password})

        // if (!name || !email || !password) {
        //     return NextResponse.json({message: 'missing fields'}, {status: 400})
        // }

        // send request to server
        const resp = await SignUp(name, email, password)

        if (!resp) {
            return NextResponse.json({error: "cannot contact server"}, {status: 503})
        }

        if (resp && resp.status === 201) {
            const payload = await resp.json()
            return NextResponse.json({message: "success", payload, credentials: {email, password}}, {status: 201})
        }

        if (resp && resp.status === 409) {
            return NextResponse.json({message: "user already exists"}, {status: 409})
        }

        console.log(await resp?.json())
        return NextResponse.json({message: "failure during sign up process"}, {status: resp?.status})
    } catch (e) {
        console.log({e});
        return NextResponse.json({error: e}, {status: 400})
    }
}
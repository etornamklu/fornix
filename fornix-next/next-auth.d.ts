import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface User {
        linkAccountRequired?: boolean
        provider?: string
    }

    interface Session {
        user: User
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        provider?: string
    }
}

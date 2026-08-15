import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credential from "next-auth/providers/credentials"
import { GoogleSignInCallback, SignIn } from "@/services/auth/auth.service"
import { cookies } from "next/headers"

export const authOptions = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        }),
        Credential({
            name: "credentials",
            credentials: {
                name: { label: "Name", type: "text" },
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            authorize: async credentials => {
                if (!credentials || !credentials.email || !credentials.password) {
                    throw new Error("Please enter an email and password")
                }

                // send sign in request
                const data = await SignIn(credentials.email, credentials.password)

                if (!data || !data.doctor) {
                    throw new Error("Error logging in")
                }
                const doctor = data.doctor
                return doctor as any
            }
        })
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google" && account.access_token) {
                // console.log('User token:', account.access_token)

                const data = await GoogleSignInCallback(account.access_token)
                if (data?.linkAccountRequired) {
                    user.linkAccountRequired = true
                    //store token in cookie
                    cookies().set("google_token", account.access_token)
                    //prevent login
                    return `/auth/signin?alert=linkAccountRequired`
                }

                if (!data || !data.doctor) {
                    throw new Error("Error logging in")
                }

                return data.doctor as any
            }

            return true
        },

        async jwt({ token, user, account }) {
            if (account) {
                token.provider = account.provider
            }
            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.provider = token.provider
            }
            return session
        }
    },

    pages: {
        signIn: "/auth/signin"
        // signOut: "/auth/signout",
    },

    secret: process.env.AUTH_SECRET,

    session: {
        strategy: "jwt",
        maxAge: 2_627_400
    },

    debug: process.env.NODE_ENV === "development"
})

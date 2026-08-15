import type { Metadata } from "next"
import { DM_Sans, Nunito } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/context/AuthContext"
import type {} from "ldrs"
import React from "react"

const dmSans = DM_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Fornix AI",
    description: "Fornix AI",
    manifest: "/manifest.json",
    icons: {
        icon: "/images/logo-primary.png"
    }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${dmSans.className}`}>
                <AuthProvider>{children}</AuthProvider>
                {/* <CustomToast
                    title="Error"
                    description="Operation failed."
                    status="error"
                    duration="2000"
                    position="bottom-right"
                /> */}
            </body>
        </html>
    )
}

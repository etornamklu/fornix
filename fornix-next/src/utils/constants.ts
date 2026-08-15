export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export const FRONTEND_BASE_URL =
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://fornixintelligence.com"

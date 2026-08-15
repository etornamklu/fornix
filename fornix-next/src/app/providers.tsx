"use client"

import { useEffect, useRef } from "react"
import { updateUserPaymentInfo } from "@/services/payment/payment.service"
import useAuthStore from "../../store/AuthStore"
import { BACKEND_BASE_URL } from "@/utils/constants"

export function GlobalFetchInterceptor({
    setShowPurchaseOverlay
}: {
    setShowPurchaseOverlay: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const { setAuth, updateAuth } = useAuthStore()
    const retryFlag = useRef(false)

    useEffect(() => {
        const originalFetch = window.fetch

        window.fetch = async (...args) => {
            let url: string
            if (typeof args[0] === "string") {
                url = args[0] // If it's a string, it's the URL
            } else if (args[0] instanceof Request) {
                url = args[0].url // If it's a Request object, extract the URL
            } else {
                return originalFetch(...args) // Fallback if unexpected input
            }

            if (!url.startsWith(BACKEND_BASE_URL ?? "/api/")) {
                return originalFetch(...args)
            }

            const response = await originalFetch(...args)

            // Check for x-credits header
            const creditsHeader = response.headers.get("x-credits")
            if (creditsHeader !== null) {
                const credits = Number(creditsHeader)
                if (!isNaN(credits)) {
                    setAuth({ credits: credits })
                    const role = useAuthStore.getState().auth.role
                    if (role !== "ADMIN") {
                        if (credits !== -1 && credits <= 0) {
                            setShowPurchaseOverlay(true)
                        }
                    }
                }
            }

            if (response.status === 402) {
                if (!retryFlag.current) {
                    retryFlag.current = true

                    try {
                        console.warn("402 detected: Updating payment info...")

                        const data = await updateUserPaymentInfo()
                        if (data?.doctor?.id) {
                            setAuth(data.doctor)

                            const role = data.doctor.role || useAuthStore.getState().auth.role
                            if (role !== "ADMIN") {
                                if (data.doctor.credits !== -1 && data.doctor.credits <= 0) {
                                    setShowPurchaseOverlay(true)
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error updating payment info:", error)
                    } finally {
                        retryFlag.current = false
                    }
                } else {
                    console.warn("402 detected again, doing nothing.")
                }
            }

            return response
        }

        return () => {
            window.fetch = originalFetch
        }
    }, [])

    return null
}

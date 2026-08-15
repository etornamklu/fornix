import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { FRONTEND_BASE_URL } from "@/utils/constants"
import { FcGoogle } from "react-icons/fc"
import { motion } from "framer-motion"

const externalUrl = `${FRONTEND_BASE_URL}/auth/signup` // Your external URL

export function ExternalBrowserWarning() {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)
    const [externalUrl, setExternalUrl] = useState(`${FRONTEND_BASE_URL}/auth/signup`)

    // Update the external URL based on the current URL path
    useEffect(() => {
        if (typeof window !== "undefined") {
            const pathname = window.location.pathname
            // Default to signup unless the pathname explicitly contains "signin"
            let authPath = "signup"
            if (pathname.includes("/signin")) {
                authPath = "signin"
            } else if (pathname.includes("/signup")) {
                authPath = "signup"
            }
            setExternalUrl(`${FRONTEND_BASE_URL}/auth/${authPath}`)
        }
    }, [])

    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        try {
            navigator.clipboard.writeText(externalUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error("Copy failed", e)
        }
    }

    const handleOpenBrowser = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        let redirectUrl = externalUrl
        // For Android devices, use an intent URL to force an external browser.
        if (/Android/i.test(navigator.userAgent)) {
            redirectUrl = `intent://${externalUrl.replace(/^https?:\/\//, "")}?redirected=true#Intent;scheme=https;package=com.android.chrome;end;`
        }
        window.open(redirectUrl, "_blank", "noopener")
    }

    return (
        <div className="flex flex-col items-center justify-center px-6 py-4 text-center">
            <div
                className="max-w-md p-4 flex flex-col justify-center items-center bg-white rounded-2xl shadow-lg cursor-pointer w-full"
                onClick={() => setExpanded(!expanded)}>
                {/* Collapsed View: Google Icon & Title on Same Row */}
                <motion.div
                    className={`flex items-center ${expanded ? "flex-col" : "flex-row"} gap-2`}
                    initial={false}
                    animate={{ flexDirection: expanded ? "column" : "row" }}
                    transition={{ duration: 0.3 }}>
                    <FcGoogle size={30} />
                    <h2 className="text-lg font-semibold text-gray-800">Open in External Browser</h2>
                </motion.div>

                {/* Expand Hint */}
                {!expanded && <p className="text-gray-500 text-sm mt-1">Tap to view instructions</p>}

                {/* Animated Expand Section */}
                <motion.div
                    initial={false}
                    animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden w-full">
                    <p className="mt-3 text-gray-600">
                        To use Google Sign-In, please open this page in an external browser such as{" "}
                        <strong className="text-gray-600">Chrome, Edge, or Safari.</strong>
                    </p>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition duration-200">
                        {copied ? "Copied!" : "Copy URL"}
                    </button>

                    {/* Divider */}
                    <div className="w-full my-4 border-t border-gray-300"></div>

                    {/* Open in Browser Link */}
                    <p className="text-gray-700">Or try tapping the link below:</p>
                    <button
                        onClick={handleOpenBrowser}
                        className="mt-2 inline-block text-blue-500 font-medium underline hover:text-blue-700 transition duration-200">
                        Open in Browser
                    </button>

                    {/* Manual Instructions */}
                    <p className="mt-4 text-sm text-gray-500">
                        If the link still opens in-app, please copy the URL and paste it into your browser.
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

export default function DetectWebView(setShowWebViewInfo: Dispatch<SetStateAction<boolean>>) {
    // const [hasRequesterReferral, setHasRequesterReferral] = useState<boolean>(false)

    async function fetchReferrer() {
        try {
            const response = await fetch("/api/referrer")
            const data = await response.json()
            const rf: boolean = data["x-requested-with"] || data["referer"]
            // setHasRequesterReferral(rf)
            setShowWebViewInfo(rf)
        } catch (error) {
            console.error("Error fetching referrer:", error)
            // setHasRequesterReferral(false)
            setShowWebViewInfo(false)
        }
    }

    useEffect(() => {
        fetchReferrer()
    }, [])

    // useEffect(() => {
    // const urlParams = new URLSearchParams(window.location.search)
    // const alreadyRedirected = urlParams.has("redirected")
    //
    // // If already redirected, show fallback UI instead of looping
    // if (alreadyRedirected) {
    //     setShowFallback(true)
    //     return
    // }
    //
    // // Append ?redirected=true to prevent infinite loop
    // let redirectUrl = `${externalUrl}?redirected=true`
    //
    // // Android WebView - Use intent:// to force external browser
    // if (/Android/i.test(navigator.userAgent)) {
    //     redirectUrl = `intent://${externalUrl.replace(/^https?:\/\//, "")}?redirected=true#Intent;scheme=https;package=com.android.chrome;end;`
    // }
    //
    // // Redirect the user
    // window.location.href = redirectUrl
    //
    // // If still in WebView after 2 seconds, show fallback UI
    // const timer = setTimeout(() => {
    //     setShowFallback(true)
    // }, 2000)
    //
    // return () => clearTimeout(timer)
    // }, [])

    // if (hasRequesterReferral) {
    // setShowWebViewInfo(true)
    // return
    // }

    return
}

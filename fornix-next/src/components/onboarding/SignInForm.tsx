import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { requestPasswordResetLink } from "@/services/auth/auth.service"
import { FcGoogle } from "react-icons/fc"
import LinkToGoogleModal from "./LinkToGoogleModal"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"
import DetectWebView, { ExternalBrowserWarning } from "@/components/DetectWebView"

export const SignInForm = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const [googleLoginError, setGoogleLoginError] = useState(false)
    const [showPasswordResetForm, setShowPasswordResetForm] = useState(false)
    const [showResetNotice, setShowResetNotice] = useState(false)
    const [showLinkToGoogleModal, setShowLinkToGoogleModal] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const linkAccountAlert = searchParams.get("alert")

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        requestPasswordResetLink(email).then(status => {
            setIsLoading(false)
            setShowResetNotice(true)
        })
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setIsError(false)
        signIn("credentials", {
            email,
            password,
            redirect: false
        }).then(response => {
            setIsLoading(false)
            if (response?.status === 200) {
                router.push("/dashboard")
            }

            if (response?.status === 401) {
                // alert(response.status)
                setIsError(true)
            }
        })
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(false)
            await signIn("google", { callbackUrl: "/dashboard" })
        } catch (error) {
            setIsLoading(false)
            setGoogleLoginError(true)
            console.log(error)
            router.push("/auth/signin")
        }
    }

    useEffect(() => {
        if (linkAccountAlert === "linkAccountRequired") {
            setShowLinkToGoogleModal(true)
        }
    }, [linkAccountAlert])

    const [showWebViewInfo, setShowWebViewInfo] = useState(false)

    DetectWebView(setShowWebViewInfo)

    return (
        <>
            {showLinkToGoogleModal && <LinkToGoogleModal showModal={showLinkToGoogleModal} />}

            <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col items-center mt-4">
                    <p className="text-2xl lg:text-4xl font-bold self-start md:self-center">Welcome back!</p>

                    <p className="text-gray-600 self-start md:self-center">
                        Log into your account and start where you left off.
                    </p>

                    {showWebViewInfo ? (
                        <ExternalBrowserWarning />
                    ) : (
                        <div
                            role="button"
                            onClick={() => handleGoogleSignIn()}
                            className="w-full my-4 py-3 border border-slate-300 flex gap-2 justify-center items-center rounded-lg font-semibold">
                            <FcGoogle size={25} />
                            <p>Log in with Google</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center h-full gap-5 items-center">
                    <span className="w-20 bg-gray-300 h-[1px]" />
                    <span className="text-gray-400">log in with email</span>
                    <span className="w-20 bg-gray-300 h-[1px]" />
                </div>

                <AnimatePresence mode="wait">
                    {showPasswordResetForm ? (
                        <motion.div
                            key="passwordResetForm"
                            initial={{ opacity: 0, x: "-20%" }}
                            animate={{ opacity: 1, x: "0%" }}
                            exit={{ opacity: 0, x: "-20%" }}
                            transition={{ duration: 0.1 }}
                            className="flex flex-col gap-6">
                            {showResetNotice && (
                                <div className="bg-green-50 text-green-800 py-2 px-1 text-center rounded-lg text-lg">
                                    Reset link sent to email!
                                </div>
                            )}
                            <div
                                role="button"
                                onClick={() => setShowPasswordResetForm(false)}
                                className="text-blue-500">
                                Go to Login
                            </div>
                            <form onSubmit={handlePasswordReset} className="flex flex-col gap-1">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="resetEmail">Email address</label>
                                    <input
                                        id="resetEmail"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        type="email"
                                        placeholder="eg. example@gmail.com"
                                        required
                                        className="outline-none rounded-md bg-slate-100 px-4 py-2 text-gray-800"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-12 rounded-lg bg-blue-500 text-white flex justify-center items-center
                                        ${isLoading ? "cursor-default" : "cursor-pointer"}`}>
                                    {isLoading ? (
                                        <SquircleLoader size={29} speed={1.1} stroke={4} color={"white"} />
                                    ) : (
                                        "Request Reset Link"
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signInForm"
                            initial={{ opacity: 0, x: "20%" }}
                            animate={{ opacity: 1, x: "0%" }}
                            exit={{ opacity: 0, x: "20%" }}
                            transition={{ duration: 0.1 }}
                            layout
                            className="flex flex-col gap-5">
                            <div
                                className={`relative bg-rose-50 text-red-700 py-2 px-2 rounded-md flex items-center

                  justify-center transition duration-100 ${isError || googleLoginError ? "h-12" : "h-0 hidden"}`}>
                                <p>
                                    {isError
                                        ? "Incorrect login credentials, please try again."
                                        : "Error logging in, please try again."}
                                </p>

                                <div className="absolute flex h-3 w-3 -right-1 -top-1">
                                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                                </div>
                            </div>
                            <form onSubmit={handleSignIn} className="flex flex-col gap-6">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="workEmail">Email Address</label>
                                    <input
                                        id="workEmail"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        type="email"
                                        autoCapitalize="none"
                                        placeholder="eg. mmichael4@gmail.com"
                                        required
                                        className="outline-none rounded-md bg-slate-100 px-4 py-2 text-gray-800"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        id="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        type="password"
                                        required
                                        className="outline-none rounded-md bg-slate-100 px-4 py-2 text-gray-800"
                                        title="password"
                                    />
                                    <p className="text-gray-500 text-sm">Password should include letters and numbers</p>
                                </div>
                                <div className="mt-4 flex flex-col items-center text-balance">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full h-12 rounded-lg bg-blue-500 text-white flex justify-center items-center
                                          ${isLoading ? "cursor-default" : "cursor-pointer"}`}>
                                        {isLoading ? (
                                            <SquircleLoader size={29} speed={1.1} stroke={4} color={"white"} />
                                        ) : (
                                            "Log In"
                                        )}
                                    </button>
                                    <div className="mt-4 flex justify-center items-center gap-1 text-sm">
                                        <p>Forgot your password?</p>
                                        <div
                                            onClick={() => setShowPasswordResetForm(true)}
                                            className="text-blue-500 underline underline-offset-4 cursor-pointer">
                                            Reset password
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}

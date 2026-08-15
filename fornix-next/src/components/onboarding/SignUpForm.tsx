import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { FcCheckmark, FcGoogle } from "react-icons/fc"
import { motion } from "framer-motion"
import { containsLettersAndNumbers } from "@/utils/auth.client"
import { HiMiniXMark } from "react-icons/hi2"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"
import DetectWebView, { ExternalBrowserWarning } from "@/components/DetectWebView"

export const SignUpForm = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [isPasswordLengthValid, setIsPasswordLengthValid] = useState(false)
    const [isPasswordContentValid, setIsPasswordContentValid] = useState(false)

    const router = useRouter()

    const handleGoogleSignUp = async () => {
        try {
            setIsLoading(true)
            await signIn("google", { callbackUrl: "/dashboard" })
        } catch (error) {
            console.log(error)
            setIsLoading(false)
            setErrorMessage("Failed to sign in, please try again.")
            router.push("/auth/signup")
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        // const resp = await SignUp(name, email, password)
        setIsLoading(true)
        setErrorMessage("")

        const passwordContainsLettersAndNumbers = containsLettersAndNumbers(password)
        const passwordLengthOver8 = password.length >= 8

        if (!name) {
            setIsLoading(false)
            setErrorMessage("Please provide your full name.")
            return
        } else if (!email) {
            setIsLoading(false)
            setErrorMessage("Please provide a valid email address.")
            return
        } else if (!passwordContainsLettersAndNumbers) {
            setIsLoading(false)
            setErrorMessage("Password should contain both letters and digits.")
            return
        } else if (!passwordLengthOver8) {
            setIsLoading(false)
            setErrorMessage("Password should be at least 8 characters.")
            return
        }

        const resp = await fetch("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify({ name, email, password })
        })

        if (resp.status === 201) {
            signIn("credentials", {
                email,
                password,
                redirect: false
            }).then(response => {
                if (response?.status === 200) {
                    router.push("/profile-setup")
                }

                if (response?.status === 401) {
                    setErrorMessage("Cannot sign up, please try again.")
                    setIsLoading(false)
                }
            })
        } else if (resp.status === 409) {
            setErrorMessage("Account already exists, try logging in.")
            setIsLoading(false)
        } else if (resp.status === 503) {
            setErrorMessage("Failed to send request, please check connection.")
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsPasswordContentValid(containsLettersAndNumbers(password))
        setIsPasswordLengthValid(password.length >= 8)
    }, [password])

    const [showWebViewInfo, setShowWebViewInfo] = useState(false)

    DetectWebView(setShowWebViewInfo)

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col items-center mt-4">
                <p className="text-2xl md:text-4xl font-bold self-start md:self-center">Create an account</p>

                <p className="text-gray-500 self-start md:self-center">Become part of the finest Health AI platform</p>

                {showWebViewInfo ? (
                    <ExternalBrowserWarning />
                ) : (
                    <div
                        role="button"
                        onClick={() => handleGoogleSignUp()}
                        className="w-full my-4 py-3 border border-slate-300 flex gap-2 justify-center items-center
                        rounded-lg font-semibold">
                        <FcGoogle size={25} />
                        <p>Sign up with Google</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-5 items-center">
                <span className="w-full md:w-16 bg-gray-300 h-[1px]" />
                <div className="text-gray-400 flex-grow min-w-fit flex justify-center items-center">
                    or create your account with email
                </div>
                <span className="w-full md:w-16 bg-gray-300 h-[1px]" />
            </div>

            <motion.div layout className="flex flex-col gap-5">
                <div
                    className={`relative bg-rose-50 text-red-700 py-2 px-2 rounded-md flex items-center justify-center
                        transition duration-100 ${errorMessage ? "h-12" : "h-0 hidden"}`}>
                    <p>{errorMessage}</p>
                    <div className="absolute flex h-3 w-3 -right-1 -top-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </div>
                </div>

                <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            type="text"
                            placeholder="eg. Michael Mensah"
                            className="outline-none rounded-md bg-slate-100 px-4 py-2 text-gray-800"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                            autoCapitalize="none"
                            placeholder="eg. email@example.com"
                            className="outline-none rounded-md bg-slate-100 px-4 py-2 text-gray-800"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            type="password"
                            className="outline-none rounded-md bg-slate-100 px-4 py-2 text-gray-800"
                            title="password"
                        />
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                            {isPasswordContentValid ? (
                                <FcCheckmark size={17} />
                            ) : (
                                <HiMiniXMark size={17} className="text-rose-500" />
                            )}
                            <span>Password should include letters and numbers</span>
                        </div>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                            {isPasswordLengthValid ? (
                                <FcCheckmark size={17} />
                            ) : (
                                <HiMiniXMark size={17} className="text-rose-500" />
                            )}
                            <span>Password should be at least 8 characters</span>
                        </div>
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
                                "Create Account"
                            )}
                        </button>

                        <div className="mt-4 text-gray-600 text-sm w-full">
                            <div className="flex justify-center items-center gap-1 px-8 flex-wrap text-balance max-w-lg">
                                <span className="min-w-fit">By creating an account, you agree to our </span>
                                <Link
                                    href={"https://khelvyn80.github.io/fornix-ai-termsofservice"}
                                    className="underline underline-offset-4 text-black font-semibold min-w-fit">
                                    Terms of Service
                                </Link>
                                <span>and</span>
                                <Link
                                    href={"/privacy"}
                                    className="underline underline-offset-4 text-black font-semibold min-w-fit">
                                    Privacy Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

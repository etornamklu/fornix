"use client"

import { SignUpForm } from "@/components/onboarding/SignUpForm"
import { SignInForm } from "@/components/onboarding/SignInForm"
import { LogoAsset } from "@/components/assets/LogoAsset"
import { LogoVariants } from "@/utils/types"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"

const FormController = () => {
    const pathname = usePathname()
    const showSignUp = pathname === "/auth/signup"

    useEffect(() => {
        clearAllDiagnosisData()
    }, [])

    return (
        <div className="select-none w-full flex flex-col justify-between lg:flex-[1/2] max-h-svh md:pt-12">
            <div className="mt-4 lg:mt-0 flex justify-between lg:justify-end items-center w-full self-end justify-self-start mb-4 md:mb-8 text-sm text-gray-600 select-none">
                <div className="flex">
                    <Link href={"/"} className="block lg:hidden">
                        <LogoAsset size={30} title={true} variant={LogoVariants.primary} />
                    </Link>
                    <span className="hidden lg:block">
                        {showSignUp ? "Already have a Fornix AI account?" : "New to Fornix AI?"}{" "}
                    </span>
                </div>
                <Link
                    href={showSignUp ? "/auth/signin" : "/auth/signup"}
                    className="underline underline-offset-4 font-bold text-lg lg:text-sm md:px-2">
                    {showSignUp ? "Login" : "Create an account"}
                </Link>
            </div>

            <div className="flex flex-1 items-center flex-col sm:justify-center">
                <Link href={"/"} className="lg:block hidden">
                    <LogoAsset size={100} title={true} variant={LogoVariants.primary} />
                </Link>

                <AnimatePresence mode="wait">
                    {showSignUp ? (
                        <motion.div
                            key="signup"
                            initial={{ opacity: 0, x: "-20%" }}
                            animate={{ opacity: 1, x: "0%" }}
                            exit={{ opacity: 0, x: "-20%" }}
                            transition={{ duration: 0.1 }}>
                            <SignUpForm />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signin"
                            initial={{ opacity: 0, x: "20%" }}
                            animate={{ opacity: 1, x: "0%" }}
                            exit={{ opacity: 0, x: "20%" }}
                            transition={{ duration: 0.1 }}>
                            <SignInForm />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default FormController

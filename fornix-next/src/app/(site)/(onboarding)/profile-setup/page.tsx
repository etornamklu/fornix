"use client"

import React, { Suspense, useEffect, useState } from "react"
import { AccountType, ProfileSetupSteps, SubscriptionType } from "@/utils/types"
import styles from "@/app/(site)/(onboarding)/profile-setup/profile-setup.module.css"

import Button from "@/components/global/Button"
import OnboardingHeader from "@/components/onboarding/OnboardingHeader"
import ProfileSetupCard from "@/components/onboarding/ProfileSetupCard"
import SubscriptionCard from "@/components/onboarding/SubscriptionCard"
import { useRouter, useSearchParams } from "next/navigation"
import { updateUserRole } from "@/services/auth/auth.service"
import { AnimatePresence, motion } from "framer-motion"
import useAuthEffect from "@/utils/hooks/useAuthEffect"
import { IoIosArrowForward } from "react-icons/io"
import useAuthStore from "../../../../../store/AuthStore"
import { FaChevronDown, FaChevronUp } from "react-icons/fa"

function Component() {
    const [currentStep, setCurrentStep] = useState<ProfileSetupSteps>(ProfileSetupSteps.StepOne)
    const isStepOne = currentStep === ProfileSetupSteps.StepOne
    const { auth, setAuth, resetAuth } = useAuthStore()
    const router = useRouter()
    const [accountType, setAccountType] = useState<AccountType>(AccountType.patient)
    const isAuthLoadingOrAdmin = auth.role === "loading" || auth.role === "ADMIN"

    useAuthEffect(setAuth)

    async function handleContinue() {
        // update user account
        const accountTypeKey = Object.entries(AccountType).find(([key, value]) => value === accountType)?.[0]

        if (!accountTypeKey) {
            console.log("invalid account type")
            return
        }

        const roleUpdate = await updateUserRole(accountTypeKey.toUpperCase())
        if ((roleUpdate && roleUpdate.success) || (roleUpdate && roleUpdate.status === 400)) {
            window.scrollTo(0, 0)
            if (accountTypeKey.toUpperCase() === "ADMIN") {
                router.push("/admin/organizations/create")
                return
            }
            setCurrentStep(ProfileSetupSteps.StepTwo)
        }
    }

    useEffect(() => {
        if (auth.role !== "loading" && auth.role !== "user") {
            // Admins should not see Purchase Credits (Step 2)
            if (auth.role === "ADMIN") {
                router.push("/admin/organizations")
                return
            }
            setCurrentStep(ProfileSetupSteps.StepTwo)

            if (auth.free_trial || auth.credits > 0) router.push("/dashboard")
        }
    }, [auth])

    return (
        <main className="px-4 lg:px-16 font-product-sans pt-0 flex flex-col w-full min-h-svh md:h-svh">
            {isAuthLoadingOrAdmin ? (
                <section className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span>Loading...</span>
                    </div>
                </section>
            ) : (
                <div className="flex-1 flex flex-col">
                    <OnboardingHeader step={currentStep} onGoBack={() => setCurrentStep(ProfileSetupSteps.StepOne)} />
                    <section className="w-full mt-6 md:py-16 pb-8">
                        <div className="md:px-6 mx-auto lg:mt-0 flex flex-col justify-center items-center h-full">
                            <div className={`w-full flex flex-col gap-6 ${!isStepOne && "lg:items-center"}`}>
                                <div className="lg:max-w-md mx-auto w-full flex justify-between">
                                    <Stepper step={currentStep} />
                                    {currentStep == ProfileSetupSteps.StepOne && (
                                        <div
                                            role="button"
                                            onClick={handleContinue}
                                            className="text-blue-500 border border-blue-500 rounded-lg px-2 flex justify-center
                                    gap-1 transition duration-300 items-center hover:bg-blue-500 hover:text-white">
                                            Next
                                            <IoIosArrowForward size={17} />
                                        </div>
                                    )}
                                    {currentStep == ProfileSetupSteps.StepTwo && auth.free_trial && (
                                        <div
                                            role="button"
                                            onClick={() => router.push("/dashboard")}
                                            className="text-blue-500 border border-blue-500 rounded-lg px-2 flex justify-center
                                    transition duration-300 items-center hover:bg-blue-500 hover:text-white">
                                            Skip
                                        </div>
                                    )}
                                </div>

                                <AnimatePresence mode="wait">
                                    {isStepOne ? (
                                        <motion.div
                                            key="profile-step-one"
                                            initial={{ opacity: 0, x: "-10%" }}
                                            animate={{ opacity: 1, x: "0%" }}
                                            exit={{ opacity: 0, x: "-25%" }}
                                            transition={{ duration: 0.1 }}>
                                            <ProfileSetupStepOne
                                                handleContinue={handleContinue}
                                                accountType={accountType}
                                                setAccountType={setAccountType}
                                                setCurrentStep={setCurrentStep}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="profile-step-two"
                                            initial={{ opacity: 0, x: "10%" }}
                                            animate={{ opacity: 1, x: "0%" }}
                                            exit={{ opacity: 0, x: "5%" }}
                                            transition={{ duration: 0.1 }}>
                                            <ProfileSetupStepTwo />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </main>
    )
}

function ProfileSetup() {
    return (
        // <ProfileSetupProtection>
        <Suspense>
            <Component />
        </Suspense>
        // </ProfileSetupProtection>
    )
}

export default ProfileSetup

const FreeTrialStartedCard = () => {
    const router = useRouter()

    useEffect(() => {
        const redirectTimeout = setTimeout(() => {
            router.push("/dashboard")
        }, 2000) // Redirect after 5 seconds (adjust timeout as needed)

        return () => clearTimeout(redirectTimeout)
    }, [router])

    return (
        <div
            className="w-full h-full flex items-center justify-center z-50 bg-blue-100
            bg-opacity-50 backdrop-blur-md p-8 rounded-lg">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full mx-auto">
                <h2 className="text-2xl font-bold mb-4">Free Trial Started!</h2>
                <p className="mb-4">Thank you for starting your free trial.</p>
                <p className="text-sm text-gray-500">Redirecting to dashboard in 5 seconds...</p>
            </div>
        </div>
    )
}

function ProfileSetupStepTwo() {
    function handleContinue() {
        // if (currentStep === ProfileSetupSteps.StepOne) {
        // 	setCurrentStep(ProfileSetupSteps.StepTwo);
        // 	return;
        // }
        // handle submit
    }

    const router = useRouter()
    const [showFreeTrialModal, setShowFreeTrialModal] = useState(false)

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full max-w-md mx-auto">
                <h1 className="text-2xl md:text-4xl font-bold">Purchase Credits</h1>
                <p className="text-gray-500 max-w-md text-sm">Select the credit plan that best suits you.</p>
            </div>

            {showFreeTrialModal && <FreeTrialStartedCard />}

            <div className={`flex flex-col  gap-6 justify-center items-center lg:flex-row lg:items-end`}>
                {Object.keys(SubscriptionType).map(key => {
                    const type = SubscriptionType[key as keyof typeof SubscriptionType]
                    return (
                        <SubscriptionCard
                            sx="!w-full"
                            key={key}
                            type={type}
                            setShowFreeTrialModal={
                                type === SubscriptionType.creditPack0 ? setShowFreeTrialModal : undefined
                            }
                        />
                    )
                })}
            </div>
            {/* <PayButton
                email={'suntanpyro@gmail.com'}
                amount={50} onSuccess={(reference) => {
                console.log(reference)
                updateUserPaymentInfo(reference, 20000)
                    .then(res => {
                        console.log(res)
                    })
                router.push('/dashboard')
            }}/> */}
        </div>
    )
}

function ProfileSetupStepOne({
    setCurrentStep,
    accountType,
    setAccountType,
    handleContinue
}: {
    setCurrentStep: React.Dispatch<React.SetStateAction<ProfileSetupSteps>>
    accountType: AccountType
    setAccountType: React.Dispatch<React.SetStateAction<AccountType>>
    handleContinue: () => void
}) {
    // const [accountType, setAccountType] = useState<AccountType>(AccountType.patient);
    // const [updateUserRoleFunc, {data: updatedRole, error, isLoading}] = useUpdateUserRoleRequestMutation();
    const params = useSearchParams()
    const token = params.get("token") as string

    function handleAccountTypeChange(type: AccountType) {
        setAccountType(prevState => (type !== AccountType.hospital && type !== AccountType.pharmacy ? type : prevState))
    }

    const [showClinicianOptions, setShowClinicianOptions] = useState(false)

    const toggleClinicianOptions = () => {
        setShowClinicianOptions(prev => !prev)
    }

    // Filter out only the patient account type since admin is now in the clinician dropdown
    const otherAccountKeys = Object.keys(AccountType).filter(key => key !== "patient")

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 }
    }

    return (
        <div className="w-full lg:max-w-md mx-auto flex flex-col gap-6">
            <div>
                <h1 className="text-2xl md:text-4xl font-bold">Profile Setup</h1>
                <p className="text-gray-500 max-w-md text-sm">
                    Select the health solution that aligns with your specific requirements.
                </p>
            </div>

            <motion.div className="w-full flex flex-col gap-6">
                {/* User/Client card (full width) */}
                <div className="w-full">
                    <ProfileSetupCard
                        selected={accountType === AccountType.patient}
                        onClick={() => handleAccountTypeChange(AccountType.patient)}
                        accountType={AccountType.patient}
                    />
                </div>

                <motion.div layout className="w-full flex flex-col gap-6">
                    {/* Top Continue button when clinician options are hidden */}
                    <AnimatePresence mode="wait">
                        {!showClinicianOptions && (
                            <motion.div
                                key="continue-top"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0 } }}
                                transition={{ duration: 0.1 }}>
                                <Button
                                    onClick={handleContinue}
                                    className="w-full blue-gradient mt-6"
                                    size="lg"
                                    label="Continue"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Divider */}
                    <div className="border-t border-gray-300 my-4" />

                    {/* Toggle button always visible */}
                    <Button
                        onClick={toggleClinicianOptions}
                        className="w-full blue-gradient flex gap-2 justify-center items-center"
                        size="md">
                        {showClinicianOptions ? "For Clinicians Only" : "Not a user/client?"}
                        {showClinicianOptions ? <FaChevronUp /> : <FaChevronDown />}
                    </Button>

                    {/* Clinician options cards */}
                    <AnimatePresence>
                        {showClinicianOptions &&
                            otherAccountKeys.map(key => {
                                const type = AccountType[key as keyof typeof AccountType]
                                return (
                                    <motion.div
                                        key={key}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}>
                                        <ProfileSetupCard
                                            selected={accountType === type}
                                            onClick={() => handleAccountTypeChange(type)}
                                            accountType={type}
                                        />
                                    </motion.div>
                                )
                            })}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* Bottom Continue button for clinician options */}
            <AnimatePresence mode="wait">
                {showClinicianOptions && (
                    <motion.div
                        key="continue-bottom"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.1 }}>
                        <Button
                            onClick={handleContinue}
                            className="w-full blue-gradient mt-6"
                            size="lg"
                            label="Continue"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Stepper({ step }: { step: ProfileSetupSteps }) {
    return (
        <div className="flex items-center gap-2">
            {/* loader */}
            <div
                className={`w-6 h-6 rounded-[50%] ${step == ProfileSetupSteps.StepOne ? styles.StepOne : styles.StepTwo}`}>
                <progress className="invisible h-0 w-0" value={50} max={100}></progress>
            </div>
            {/*current step  */}
            <div>
                <h2 className="text-md font-semibold">
                    {step == ProfileSetupSteps.StepOne ? (
                        "Step 1/2"
                    ) : (
                        <div className="flex gap-4 items-center">
                            <span>Step 2/2</span>

                            <div className="rounded-full px-2 py-1 text-sm bg-[#F0FDF4] text-[#15803D]">
                                <span>Completed</span>
                            </div>
                        </div>
                    )}
                </h2>
            </div>
        </div>
    )
}

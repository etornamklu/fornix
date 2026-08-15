"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { LightningBoltIcon } from "@radix-ui/react-icons"
import { PayButton } from "@/components/payment/PayButton"
import useAuthEffect from "@/utils/hooks/useAuthEffect"
import { startFreeTrial, updateUserPaymentInfo } from "@/services/payment/payment.service"
import { SubscriptionCardProps, SubscriptionType } from "@/utils/types"
import useAuthStore from "../../../store/AuthStore"

function SubscriptionCard({
    type,
    setShowFreeTrialModal,
    className = "",
    showBadge = true,
    sx = ""
}: SubscriptionCardProps) {
    const router = useRouter()

    const descriptions = {
        [SubscriptionType.creditPack0]: "",
        [SubscriptionType.creditPack1]: "Discover Fornix AI's power.",
        [SubscriptionType.creditPack2]: "Elevate your experience.",
        [SubscriptionType.creditPack3]: "Unlock ultimate potential."
    }

    const prices = {
        [SubscriptionType.creditPack0]: 0,
        [SubscriptionType.creditPack1]: 50,
        [SubscriptionType.creditPack2]: 100,
        [SubscriptionType.creditPack3]: 200
    }

    const creditsText = {
        [SubscriptionType.creditPack0]: 2,
        [SubscriptionType.creditPack1]: 50,
        [SubscriptionType.creditPack2]: 100,
        [SubscriptionType.creditPack3]: 200
    }

    const benefits = {
        [SubscriptionType.creditPack0]: ["2 Credits", "Basic feature access"],
        [SubscriptionType.creditPack1]: ["50 Credits", "Advanced feature access"],
        [SubscriptionType.creditPack2]: ["Save 50%", "100 Credits", "Premium features"],
        [SubscriptionType.creditPack3]: ["Save 60%", "200 Credits", "Exclusive access"]
    }

    const backgroundColors = {
        [SubscriptionType.creditPack0]: "bg-gray-100 text-gray-800",
        [SubscriptionType.creditPack1]: "bg-blue-100 text-blue-800",
        [SubscriptionType.creditPack2]: "bg-purple-100 text-purple-800",
        [SubscriptionType.creditPack3]: "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
    }

    const isPremium = type === SubscriptionType.creditPack3

    const { auth, setAuth } = useAuthStore()

    const updateAuth = useAuthEffect(setAuth)

    const handlePaySuccess = (reference: any) => {
        console.log(reference)

        setTimeout(
            () =>
                updateUserPaymentInfo(reference, prices[type] * 100).then(res => {
                    console.log(res)
                    updateAuth()
                }),
            1000
        )

        setTimeout(() => router.push("/dashboard"), 2000)
    }

    const handleFreeTrial = () => {
        startFreeTrial().then(res => {
            if (res && setShowFreeTrialModal) {
                setShowFreeTrialModal(true)
            }
        })
    }

    useAuthEffect(setAuth)

    const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (auth.free_trial && type === SubscriptionType.creditPack0) return null
    if (!PAYSTACK_PUBLIC_KEY) return <div>Payment setup is unavailable at this time.</div>

    return (
        <div
            className={`relative w-full max-w-xs p-6 rounded-lg shadow-lg overflow-hidden transition-transform ${backgroundColors[type]} ${className} ${sx}`}
            style={{
                maxHeight: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem" // Consistent gap between sections
            }}>
            {/* Premium Badge */}
            {isPremium && showBadge && (
                <div className="absolute -top-1 right-2 bg-yellow-600 text-white rounded-full py-1 px-2 text-xs font-bold shadow-md flex items-center">
                    <LightningBoltIcon className="text-xs mr-1" />
                    Best Value
                </div>
            )}

            {/* Header */}
            <div className="text-center">
                <h3 className="text-xl font-semibold capitalize">{type}</h3>
                <p className="text-sm text-gray-600 mt-1">{descriptions[type]}</p>
            </div>

            {/* Price */}
            <div className="text-center">
                <p
                    className={`text-4xl font-bold ${isPremium ? "text-white" : "text-gray-900"}`}>{`¢${prices[type]}`}</p>
                <p className="text-sm text-gray-600 mt-1">{creditsText[type]} Credits</p>
            </div>

            {/* Benefits */}
            <ul className="space-y-2 flex-grow">
                {benefits[type].map((benefit, index) => (
                    <li key={index} className="flex items-center text-sm">
                        <span className="material-icons text-green-500 text-sm mr-2">check_circle</span>
                        {benefit}
                    </li>
                ))}
            </ul>

            {/* Call-to-Action */}
            <div className="mt-4">
                {type === SubscriptionType.creditPack0 ? (
                    <button
                        onClick={handleFreeTrial}
                        className="w-full py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all">
                        Start Free Trial
                    </button>
                ) : (
                    <PayButton
                        text={`Pay ¢${prices[type]}`}
                        email={auth.email}
                        amount={prices[type] * 100}
                        onSuccess={handlePaySuccess}
                    />
                )}
            </div>
        </div>
    )
}

export default SubscriptionCard

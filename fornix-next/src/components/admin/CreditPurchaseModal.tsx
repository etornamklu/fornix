"use client"

import React, { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import { PayButton } from "@/components/payment/PayButton"
import { updateUserPaymentInfo } from "@/services/payment/payment.service"
import { getOrganization } from "@/services/organization/credit.service"
import useAuthStore from "../../../store/AuthStore"

interface CreditPurchaseModalProps {
    onClose: () => void
    onPurchaseSuccess: () => void
    creditUsageType: "pool" | "individual" | "role"
}

interface CreditPack {
    id: string
    name: string
    credits: number
    price: number
    description: string
    features: string[]
    popular?: boolean
}

const creditPacks: CreditPack[] = [
    {
        id: "pack1",
        name: "Small Credit Pack",
        credits: 50,
        price: 50,
        description: "Perfect for small teams",
        features: ["50 Credits", "Email support", "Basic features"]
    },
    {
        id: "pack2",
        name: "Standard Credit Pack",
        credits: 100,
        price: 100,
        description: "Best for growing organizations",
        features: ["100 Credits", "Priority support", "All features", "Save 50%"],
        popular: true
    },
    {
        id: "pack3",
        name: "Promo Credit Pack",
        credits: 200,
        price: 200,
        description: "Maximum value for large teams",
        features: ["200 Credits", "Premium support", "All features", "Save 60%"]
    }
]

// Success message component
function PurchaseSuccessMessage({ credits, onClose }: { credits: number; onClose: () => void }) {
    // No auto-close - let the user close it manually

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg animate-in fade-in slide-in-from-bottom duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Purchase Successful!</h3>
                    <p className="text-gray-600 mb-4">{credits} credits have been added to your organization.</p>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CreditPurchaseModal({ onClose, onPurchaseSuccess, creditUsageType }: CreditPurchaseModalProps) {
    const [selectedPack, setSelectedPack] = useState<CreditPack | null>(creditPacks[1]) // Default to Standard Pack
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [purchasedCredits, setPurchasedCredits] = useState(0)
    const { auth, updateAuth } = useAuthStore()

    const handlePaySuccess = (reference: any) => {
        setIsPurchasing(true)

        // First process the payment with Paystack
        setTimeout(
            () =>
                updateUserPaymentInfo(reference, selectedPack?.price ? selectedPack.price * 100 : 0)
                    .then(async res => {
                        // Backend now handles credit updates automatically
                        console.log("DEBUG - Payment successful, backend will handle credit update automatically")
                        console.log("DEBUG - Purchased credits:", selectedPack?.credits)

                        // Store the purchased credits amount and show success message
                        if (selectedPack?.credits) {
                            setPurchasedCredits(selectedPack.credits)
                            setShowSuccess(true)
                        }

                        // Update auth but don't close the modal yet
                        updateAuth()

                        // Don't call onPurchaseSuccess() here as it would close the modal
                        // Just stop the purchasing indicator
                        setIsPurchasing(false)
                    })
                    .catch(err => {
                        console.error("Payment processing error:", err)
                        setIsPurchasing(false)
                    }),
            1000
        )
    }

    const handlePayClose = () => {
        setIsPurchasing(false)
    }

    // Don't show the purchase modal if success message is showing
    if (showSuccess) {
        return (
            <PurchaseSuccessMessage
                credits={purchasedCredits}
                onClose={() => {
                    // First hide the success message
                    setShowSuccess(false)

                    // Then notify parent and close the modal
                    onPurchaseSuccess()
                    onClose()
                }}
            />
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Purchase Credits</h2>
                            <p className="text-sm text-blue-100">Select a credit pack for your organization</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-blue-500 rounded p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Credit Packs Grid */}
                <div className="p-6 bg-white overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {creditPacks.map(pack => (
                            <div
                                key={pack.id}
                                onClick={() => setSelectedPack(pack)}
                                className={`
                                    relative border rounded-lg p-5 cursor-pointer transition-all
                                    ${
                                        selectedPack?.id === pack.id
                                            ? "border-blue-500 bg-blue-50 shadow"
                                            : "border-gray-200 hover:border-blue-300 hover:shadow"
                                    }
                                `}>
                                {/* Popular Badge */}
                                {pack.popular && (
                                    <div className="absolute -top-2 right-4 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                                        POPULAR
                                    </div>
                                )}

                                {/* Selection Indicator */}
                                {selectedPack?.id === pack.id && (
                                    <div className="absolute top-4 right-4 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-white" />
                                    </div>
                                )}

                                {/* Pack Name */}
                                <h3 className="text-lg font-medium text-gray-900 mb-2 pr-8">{pack.name}</h3>

                                {/* Price */}
                                <div className="mb-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-gray-900">¢{pack.price}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{pack.credits} Credits</p>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-4">{pack.description}</p>

                                {/* Features */}
                                <ul className="space-y-2">
                                    {pack.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                            <div className="text-blue-500">
                                                <Check size={14} />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Usage Type Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-500 mt-0.5">
                                <span className="font-bold">ℹ</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    Current Credit Usage Type:{" "}
                                    <span className="text-blue-600 capitalize">{creditUsageType}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    {creditUsageType === "pool" &&
                                        "Credits will be added to your organization's shared pool."}
                                    {creditUsageType === "individual" &&
                                        "Credits will be distributed to individual users in your organization."}
                                    {creditUsageType === "role" &&
                                        "Credits will be allocated across different roles in your organization."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    {selectedPack && (
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Selected Pack</p>
                                    <p className="text-lg font-medium text-gray-900">{selectedPack.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">¢{selectedPack.price}</p>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 text-sm font-medium">
                                    Cancel
                                </button>
                                <div className="flex-1">
                                    <PayButton
                                        email={auth.email || ""}
                                        amount={selectedPack.price * 100}
                                        onSuccess={handlePaySuccess}
                                        onClose={handlePayClose}
                                        text={isPurchasing ? "Processing..." : `Pay ¢${selectedPack.price}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

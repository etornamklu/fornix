"use client"
import React from "react"
import { FaShoppingCart } from "react-icons/fa"
import CreditCoins from "@/assets/coins.png"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"

const RemainingCredits = ({
    credits,
    setShowCreditPurchaseOverlay
}: {
    credits: number
    setShowCreditPurchaseOverlay: (b: boolean) => void
}) => {
    return (
        <div
            onClick={() => setShowCreditPurchaseOverlay(true)}
            className="w-full cursor-pointer relative gradient2 text-white overflow-hidden rounded-[6px] p-2">
            <div
                className="w-[50%] h-[100%] absolute -top-6 right-0 bg-[url('/images/logo-plain.png')]
                bg-no-repeat bg-cover opacity-10"
            />
            <div className="relative flex items-center justify-between">
                <div className="flex items-center">
                    <div className="flex items-center bg-blue-400/80 rounded-md w-6 h-6 p-1">
                        <img src={CreditCoins.src} alt="credit-coins" className="w-4 h-4" />
                    </div>
                    <p className="ml-2 text-sm font-semibold">
                        {credits && credits !== -1 ? (
                            Math.max(credits, 0).toLocaleString()
                        ) : (
                            <SquircleLoader
                                size={12}
                                stroke={2}
                                stroke-length={0.1}
                                bg-opacity={0.1}
                                speed={1}
                                color={`#eaefff`}
                            />
                        )}
                    </p>
                </div>

                <button className="bg-transparent  text-white rounded-full p-1 hover:bg-opacity-80 transition-all duration-300">
                    <FaShoppingCart size={14} />
                </button>
            </div>
        </div>
    )
}

export default RemainingCredits

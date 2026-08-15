import { CgClose } from "react-icons/cg"
import Subscription from "@/components/patients/settings/Subscription"
import React from "react"

export const CreditPurchaseOverlay = ({
    setShowCreditPurchaseOverlay
}: {
    setShowCreditPurchaseOverlay: (showCreditPurchaseOverlay: boolean) => void
}) => {
    return (
        <div className="fixed px-4 md:px-0 inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-[1px]">
            <div
                className="relative bg-white w-[100%] md:w-[100%] lg:w-[80%] max-h-[70%] p-4 md:p-6 rounded-lg shadow-lg
                 overflow-hidden transition-transform duration-300">
                <button
                    onClick={() => setShowCreditPurchaseOverlay(false)}
                    className="absolute -top-1 -right-1 bg-white p-2 rounded-full shadow-lg text-gray-600 hover:text-red-500 hover:bg-gray-100 transition-colors duration-300 focus:outline-none"
                    aria-label="Close">
                    <CgClose size={20} />
                </button>

                <div className="overflow-y-auto max-h-[60vh] py-4">
                    <Subscription smallView={true} />
                </div>
            </div>
        </div>
    )
}

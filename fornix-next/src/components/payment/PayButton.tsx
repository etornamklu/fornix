// "use client";
// import { PaystackButton } from "react-paystack";

import {PaystackButton} from "react-paystack";

export const PayButton = ({email, amount, onSuccess, onClose, text}: {
    email: string;
    amount: number;
    onSuccess?: (reference: any) => void;
    onClose?: () => void;
    text?: string
}) => {
    // amounts are in pesewa
    const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!PAYSTACK_PUBLIC_KEY) return <div>Paystack setup failed.</div>;
    const cedis = Math.floor(amount / 100);
    const pesewas = (amount % 100).toString().padStart(2, "0");
    return (
        <div
            className={`w-full bg-white flex justify-center items-center rounded-lg shadow text-lg border
	            border-gray-200 text-gray-700 transition duration-200 hover:bg-blue-500 hover:text-white 
	            hover:border-blue-100 hover:rounded-2xl hover:shadow-lg font-semibold`}>
            <PaystackButton
                publicKey={PAYSTACK_PUBLIC_KEY}
                email={email}
                amount={amount}
                text={text ?? `Pay GH₵ ${cedis}.${pesewas}`}
                onClose={onClose}
                onSuccess={onSuccess}
                currency="GHS"
                className="p-2"
            />
        </div>
    );
};

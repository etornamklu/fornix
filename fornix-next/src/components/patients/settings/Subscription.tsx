import React, { useState } from "react"

import { SubscriptionType } from "@/utils/types"

import SubscriptionCard from "@/components/onboarding/SubscriptionCard"
import BillingRow from "./BillingRow"
import useAuthStore from "../../../../store/AuthStore"

// import BillHistory from "../../../components/patients/settings/BillingHistory";

export interface IPlan {
    no: number
    date: string
    status: string
    amount: number
    plan: string
}

const plans: IPlan[] = [
    {
        no: 1,
        date: "25/09/24",
        status: "processing",
        amount: 20,
        plan: "Standard"
    },
    {
        no: 2,
        date: "25/09/24",
        status: "success",
        amount: 100,
        plan: "Premium"
    },
    {
        no: 3,
        date: "25/09/24",
        status: "success",
        amount: 20,
        plan: "Standard"
    },
    {
        no: 4,
        date: "25/09/24",
        status: "failed",
        amount: 100,
        plan: "Premium"
    }
]

type SubscriptionProps = {
    smallView?: boolean
}

const Subscription = (props: SubscriptionProps) => {
    const smallView = props.smallView || false
    const { auth } = useAuthStore()
    // const [currentPlan, setCurrentPlan] = useState("premium");
    return (
        <div className="h-auto">
            <h2 className={`font-bold text-3xl mb-2 ${smallView && "hidden"}`}>Subscriptions & Credits</h2>
            <h3 className={`${smallView ? "" : "hidden"} text-2xl`}>
                You have <span className="text-blue-700 font-medium">{Math.max(auth.credits, 0)}</span> credits.
                Purchase more here:
            </h3>
            {/*<div className="flex items-center gap-2">*/}
            {/*    <p>Current plan: </p> <span*/}
            {/*    className="py-[3px] block text-white text-sm px-2 capitalize rounded-full bg-[#F9921B]">{currentPlan}</span>*/}
            {/*</div>*/}

            <div className="w-full px-2 flex flex-col md:flex-row mt-6 md:mt-12 md:items-end gap-8">
                <SubscriptionCard
                    smallView={smallView}
                    type={SubscriptionType.creditPack2}
                    className="bg-white"
                    sx="!w-full !p-6"
                    // ctaText={`${currentPlan === "standard" ? "Your current plan" : "Downgrade to standard"}`}
                />
                <SubscriptionCard
                    smallView={smallView}
                    type={SubscriptionType.creditPack3}
                    showBadge={false}
                    sx="!w-full !p-6"
                    className={"bg-white text-white"}
                    // ctaText={`${currentPlan === "premium" ? "Your current plan" : "Upgrade to premium"}`}
                />
                <SubscriptionCard
                    smallView={smallView}
                    type={SubscriptionType.creditPack1}
                    className="bg-white"
                    sx="!w-full !p-6"
                    // ctaText={`${currentPlan === "standard" ? "Your current plan" : "Downgrade to standard"}`}
                />
            </div>

            {!smallView && (
                <section className="mt-12 w-full">
                    {/* <BillHistory /> */}
                    {/* <h3 className="text-xl font-bold">Billing history</h3>

                <div
                    className="w-full flex bg-gray-100 border-[1px]  rounded-[8px] items-center justify-between mt-2 gap-3 p-2 border-border">
                    <div className="w-[15%] text-sm text-gray-600 flex items-center gap-3 justify-start">
                        <span className="w-4 block h-4 rounded-[5px] border-[1px]"></span>
                        No.
                    </div>
                    <p className="w-[15%] text-sm text-gray-600">Date</p>
                    <p className="w-[100px] md:w-1/4 text-sm text-gray-600">Status</p>
                    <p className="hidden md:block w-[15%] text-sm text-gray-600">Amount</p>
                    <p className="hidden md:block w-[15%] text-sm text-gray-600">Plan</p>
                    <div className="hidden md:block w-[15%]  text-sm text-gray-600"></div>
                </div> */}

                    <div>
                        {/*{plans?.map((plan: IPlan) => (*/}
                        {/*    <BillingRow key={plan?.no} {...plan} />*/}
                        {/*))}*/}
                    </div>
                </section>
            )}
        </div>
    )
}

export default Subscription

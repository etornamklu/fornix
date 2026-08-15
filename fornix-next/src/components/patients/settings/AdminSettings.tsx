import React, { SetStateAction, useEffect, useState } from "react"

import Tokens from "./Tokens"
import General from "./General"
// import Subscription from "./Subscription"
// import BillHistory from "../../../components/patients/settings/BillingHistory"
import EmergencyContacts from "./EmergencyContacts"

import { LuShield, LuFileText, LuCoins } from "react-icons/lu"
import { PiUser } from "react-icons/pi"
import { BiPhoneCall } from "react-icons/bi"
import Security from "@/components/patients/settings/Security"
import { authDefault, DashboardPath } from "@/utils/types"
import useAuthStore from "../../../../store/AuthStore"
import { useTabStore } from "../../../../store/TabStore"
import { useRouter } from "next/navigation"

const SettingsIndex = ({}: {}) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()
    const [active, setActive] = useState(0)
    const router = useRouter()
    const pages = [
        <General auth={auth} key={0} />,
        <Security key={1} />,
        // <Subscription key={2} />,
        // <BillHistory key={3} />
        // <Tokens key={4}/>,
        // <EmergencyContacts key={5}/>
    ]

    return (
        <div className="h-[100%] w-full md:px-3 md:h-screen px-0  md:mt-0">
            <div className="font-bold hidden md:flex mt-0 items-center justify-between h-12 z-[2]">
                <h1>Settings</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-rose-50 border border-rose-400 py-2 rounded-[5px] text-rose-500 px-4">
                        Close
                    </button>
                </div>
            </div>

            <section
                className="md:h-[calc(98vh-90px)] md:pl-6 rounded-[8px] mb-5 bg-white w-full h-auto md:mt-2
                    flex flex-col md:flex-row md:gap-6">
                {/* Navigation for desktop */}
                <aside className="hidden md:block pt-6 w-full md:w-1/4">
                    <button
                        className={`block ${
                            active === 0 ? "bg-[#2381D2] text-[#2381D2]" : "text-gray-500 group hover:text-[#2381D2]"
                        } flex items-center gap-2 justify-start w-full mb-2 font-medium p-2 rounded-[8px] bg-opacity-[0.06]`}
                        onClick={() => setActive(0)}>
                        <span className="w-5 h-5 flex items-center justify-center group-hover:text-[#2381D2]">
                            <PiUser />
                        </span>
                        <p className="text-sm">General</p>
                    </button>
                    <button
                        className={`block ${
                            active === 1 ? "bg-[#2381D2] text-[#2381D2]" : "text-gray-500 group hover:text-[#2381D2]"
                        } flex items-center gap-2 justify-start w-full mb-2 font-medium p-2 rounded-[8px] bg-opacity-[0.06]`}
                        onClick={() => setActive(1)}>
                        <span className="w-5 h-5 flex items-center justify-center group-hover:text-[#2381D2]r ">
                            <LuShield />
                        </span>
                        <p className="text-sm">Security</p>
                    </button>
                    {/* <button
                        className={`block ${
                            active === 2 ? "bg-[#2381D2] text-[#2381D2]" : "text-gray-500 group hover:text-[#2381D2]"
                        } flex items-center gap-2 justify-start w-full mb-2 font-medium p-2 rounded-[8px] bg-opacity-[0.06]`}
                        onClick={() => setActive(2)}>
                        <span className="w-5 h-5 flex items-center justify-center group-hover:text-[#2381D2]">
                            <LuFileText />
                        </span>
                        <p className="text-sm">Subscription & credit</p>
                    </button>
                    <button
                        className={`block ${
                            active === 3 ? "bg-[#2381D2] text-[#2381D2]" : "text-gray-500 group hover:text-[#2381D2]"
                        } flex items-center gap-2 justify-start w-full mb-2 font-medium p-2 rounded-[8px] bg-opacity-[0.06]`}
                        onClick={() => setActive(3)}>
                        <span className="w-5 h-5 flex items-center justify-center group-hover:text-[#2381D2]">
                            <LuCoins />
                        </span>
                        <p className="text-sm">Billing History</p>
                    </button> */}
                </aside>

                <div className="w-full rounded-r-[8px]  h-auto pt-3 md:bg-white md:pb-12 pb-6  border-[1px] md:border-[0]  md:overflow-y-auto md:border-l-[1px] border-border px-3 md:px-6">
                    {/* Navigation for phone */}
                    <aside className="md:hidden hide-scroll w-full overflow-x-auto mb-6 py-3 md:py-0 rounded-[8px] bg-[#F8FAFC]">
                        <div className="w-[150%] flex items-center justify-between">
                            <button
                                className={`px-4 text-[16px] p-2 ${
                                    active === 0 ? "text-black shadow-lg bg-white" : "text-gray-500 hover:text-black"
                                } font-medium p-2 rounded-[8px]`}
                                onClick={() => setActive(0)}>
                                <p className="text-sm">General</p>
                            </button>
                            <button
                                className={`px-4 text-[16px] p-2 ${
                                    active === 1 ? "text-black shadow-lg bg-white" : "text-gray-500 hover:text-black"
                                } font-medium p-2 rounded-[8px]`}
                                onClick={() => setActive(1)}>
                                <p className="text-sm">Security</p>
                            </button>
                            {/* <button
                                className={`px-4 text-[16px] p-2 ${
                                    active === 2 ? "text-black shadow-lg bg-white" : "text-gray-500 hover:text-black"
                                } font-medium p-2 rounded-[8px]`}
                                onClick={() => setActive(2)}>
                                <p className="text-sm">Subscription & billing</p>
                            </button>
                            <button
                                className={`px-4 text-[16px] p-2 ${
                                    active === 3 ? "text-black shadow-lg bg-white" : "text-gray-500 hover:text-black"
                                } font-medium p-2 rounded-[8px]`}
                                onClick={() => setActive(3)}>
                                <p className="text-sm">Billing History</p>
                            </button> */}
                            <button
                                className={`px-4 text-[16px] p-2 ${
                                    active === 4 ? "text-black shadow-lg bg-white" : "text-gray-500 hover:text-black"
                                } font-medium p-2 rounded-[8px]`}
                                onClick={() => setActive(4)}>
                                <p className="text-sm">Tokens & usage</p>
                            </button>
                        </div>
                    </aside>

                    <div className="w-full h-full md:pb-12 overflow-y-auto md:h-auto md:py-6">
                        {pages[active]}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default SettingsIndex

import React, { Dispatch, SetStateAction } from "react"
import Link from "next/link"
import { DashboardPath } from "@/utils/types"
import Button from "../global/Button"
import { IoClose } from "react-icons/io5"
import { useTabStore } from "../../../store/TabStore"

const CloseBtn = ({}: {}) => {
    const { activeTab, setActiveTab } = useTabStore()

    return (
        <div>
            <Link href={"/"} onClick={() => setActiveTab(DashboardPath.Base)}>
                <Button className="h-[40px] w-[40px] flex justify-center place-items-center bg-white rounded-full">
                    <IoClose className="text-slate-900 font-semibold" size={"24px"} />
                </Button>
            </Link>
        </div>
    )
}

export default CloseBtn

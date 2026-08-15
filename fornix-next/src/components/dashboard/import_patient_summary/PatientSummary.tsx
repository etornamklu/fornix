import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { ImportPatientUserData } from "@/utils/types"
import { sendConnectionRequest } from "@/services/dashboard/connections.service"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"
import { CustomToast } from "@/components/ui/CustomToast"

const PatientSummary = ({ setPage }: { setPage: Dispatch<SetStateAction<number>> }) => {
    const [patientData, setPatientData] = useState<ImportPatientUserData>({} as ImportPatientUserData)
    const [sendRequestLoading, setSendRequestLoading] = useState(false)
    const [showToast, setShowToast] = useState(false) // State to show toast
    const [toastProps, setToastProps] = useState({ title: "", description: "", status: "" }) // State for toast props

    const sendRequest = async () => {
        setSendRequestLoading(true)
        setShowToast(false) // Reset toast visibility before the operation

        const connResp = await sendConnectionRequest(patientData.user_code)
        setSendRequestLoading(false)

        if (connResp.status === 200) {
            // request successful
            setPage(prev => prev + 1)
        } else {
            // request failed, show reason with toast
            setToastProps({
                title: "Error",
                description:
                    connResp.status === 409
                        ? "Patient connection request already exists."
                        : "Failed to send request. Please try again.",
                status: "error"
            })
            setShowToast(true) // Show the toast
            if (connResp.status === 409) setPage(0) // Optional: handle 409 differently
        }
    }

    useEffect(() => {
        setPatientData(JSON.parse(window.localStorage.getItem("ipsfp") ?? "{}"))
    }, [])

    return (
        <main className="h-full w-full flex py-16 overflow-y-auto items-center justify-center">
            <div className="mx-auto bg-white py-10 md:py-6 p-6 shadow-md w-full max-w-sm gap-2 flex items-center justify-center flex-col rounded-[12px] ">
                <p className="font-bold text-[#667185] text-sm">{patientData.user_code}</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{patientData.name}</p>
                    <p className="rounded-full px-2 py-[3px] bg-[#FAEBE3] text-[#7D3A16] text-[13px] font-bold">
                        {patientData.role}
                    </p>
                </div>
                <p className="font-light text-[#667185] text-sm">{patientData.email}</p>

                <div className="border-[1px] w-full mb-6 p-4 rounded-[10px] select-none">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#667185] text-sm">Marital Status</p>
                        <p className="text-black text-sm font-medium blur-sm">Married</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#667185] text-sm">Gender</p>
                        <p className="text-black text-sm font-medium blur-sm">Male</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#667185] text-sm">Date Of Birth</p>
                        <p className="text-black text-sm font-medium blur-sm">12/09/1992</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#667185] text-sm">Denomination</p>
                        <p className="text-black text-sm font-medium blur-sm">Dumb Data</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#667185] text-sm">Height</p>
                        <p className="text-black text-sm font-medium blur-sm">5ft 5in </p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#667185] text-sm">Blood group</p>
                        <p className="text-black text-sm font-medium blur-sm">O+</p>
                    </div>
                </div>

                <button
                    onClick={() => sendRequest()}
                    className="blue-gradient w-full h-12 rounded-lg text-white flex justify-center items-center">
                    {sendRequestLoading ? (
                        <SquircleLoader size={30} speed={1.1} stroke={4} color={"white"} />
                    ) : (
                        <p>Send request</p>
                    )}
                </button>

                <button
                    onClick={() => {
                        setPage(0)
                    }}
                    className="border border-rose-500 text-rose-500 w-full h-12 rounded-lg">
                    Cancel
                </button>

                {/* Conditionally render the CustomToast */}
                {showToast && (
                    <CustomToast
                        title={toastProps.title}
                        description={toastProps.description}
                        status={toastProps.status as "success" | "error"}
                        duration={3000} // Adjust the duration as needed
                        position="top-right"
                    />
                )}
            </div>
        </main>
    )
}

export default PatientSummary

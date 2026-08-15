import React, { SetStateAction, useEffect, useState } from "react"
import { VscVerifiedFilled } from "react-icons/vsc"
import { ConnectionStatus, ImportPatientUserData, UserConnection } from "@/utils/types"
import { deleteConnection, getAllConnections } from "@/services/dashboard/connections.service"
import { CustomToast } from "@/components/ui/CustomToast"

const WaitingForConfirmation = ({
    setPage,
    waitingTime
}: {
    setPage: React.Dispatch<SetStateAction<number>>
    waitingTime?: number
}) => {
    const [timeLeft, setTimeLeft] = useState(Number(waitingTime ?? 600)) // Total time in seconds
    const totalDuration = waitingTime ?? 600 // Define total countdown duration
    const radius = 150
    const strokeWidth = 25
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI

    const [patientData, setPatientData] = useState<ImportPatientUserData>({} as ImportPatientUserData)
    const [toast, setToast] = useState<{
        title: string
        description: string
        status: "success" | "error" | "info" | "warning"
    } | null>(null)

    // Function to calculate stroke-dashoffset based on remaining time
    const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference

    const handleCancel = async () => {
        await deleteConnection(patientData.user_code)
        setToast({
            title: "Request Cancelled",
            description: "The connection request has been cancelled.",
            status: "error"
        })
        setPage(0) // Redirect to start page
    }

    useEffect(() => {
        const pd = JSON.parse(window.localStorage.getItem("ipsfp") ?? "{}") as ImportPatientUserData
        setPatientData(pd)

        const fetchConnectionsAndCheckStatus = async () => {
            const conns = (await getAllConnections()) as UserConnection[]
            const connection = conns.find(conn => conn.receiver_user_code === pd.user_code)

            if (connection) {
                if (connection.connection_status === ConnectionStatus.ACCEPTED) {
                    setToast({
                        title: "Connection Accepted",
                        description: "Redirecting to the diagnosis page.",
                        status: "success"
                    })
                    localStorage.setItem("aip_id", connection.patient.id)
                    setPage(3) // Go to Patient Data page
                } else if (connection.connection_status === ConnectionStatus.REJECTED) {
                    setToast({
                        title: "Connection Rejected",
                        description: "Redirecting to the start page.",
                        status: "error"
                    })
                    setPage(0) // Redirect to start page
                }
            }
        }

        const timer = setInterval(() => {
            setTimeLeft(prevTimeLeft => {
                if (prevTimeLeft > 0) {
                    if (prevTimeLeft % 5 === 0) fetchConnectionsAndCheckStatus()
                    return prevTimeLeft - 1
                } else {
                    clearInterval(timer)
                    handleCancel() // Cancel request if time runs out
                    return 0
                }
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [setPage])

    return (
        <div className="w-full h-full pb-12 overflow-y-auto">
            <div className="flex-col w-full p-4 gap-8 max-w-[560px] mx-auto h-auto min-h-[100%] items-center justify-center flex">
                <h3 className="font-bold text-2xl text-center">Waiting For Patient&apos;s Confirmation</h3>

                <div className="w-[180px] h-[180px] sm:w-[254px] sm:h-[254px] relative">
                    <svg height="100%" width="100%" viewBox="0 0 254 254">
                        <circle
                            stroke="#F0F2FC"
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            r={normalizedRadius}
                            cx="127"
                            cy="127"
                        />
                        <circle
                            stroke="#4CAF50" // Green color
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference + " " + circumference}
                            style={{ strokeDashoffset }}
                            strokeLinecap="round"
                            r={normalizedRadius}
                            cx="127"
                            cy="127"
                            transform={`rotate(-90 127 127)`} // To start at the top
                        />
                    </svg>

                    <div className="absolute top-2/4 left-2/4 -translate-x-1/2 -translate-y-1/2 text-3xl w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] bg-white flex justify-center place-items-center font-medium rounded-full shadow-xl">
                        <div className="font-bold">
                            {Math.floor(timeLeft / 60)}:{("0" + (timeLeft % 60)).slice(-2)}
                        </div>
                    </div>
                </div>

                <div className="bg-[#F8FAFC] p-4 border border-[#E2E8F0] rounded-[12px] flex-col items-center justify-center">
                    <h3 className="font-bold mb-4">Why Fornix AI</h3>
                    <div className="flex gap-[6px] mb-4 items-start justify-start">
                        <VscVerifiedFilled className="text-[#16A34A] text-xl" />
                        <p className="w-[calc(100%-20px)] text-sm text-[#667185]">
                            Simplifies importing patient summaries from EMR for doctors.
                        </p>
                    </div>

                    <div className="flex gap-[6px] mb-4 items-start justify-start">
                        <VscVerifiedFilled className="text-[#16A34A] text-xl" />
                        <p className="w-[calc(100%-20px)] text-sm text-[#667185]">
                            Fornix AI boosts accuracy in clinical summaries and diagnoses for doctors.
                        </p>
                    </div>
                </div>

                <div className="w-full md:max-w-[200px] mt-8 mx-auto">
                    <button
                        onClick={() => handleCancel()}
                        className="bg-red-600 text-white rounded-lg h-12 flex justify-center items-center w-full">
                        Cancel Request
                    </button>
                </div>
            </div>

            {/* Render the CustomToast if a toast is present */}
            {toast && <CustomToast title={toast.title} description={toast.description} status={toast.status} />}
        </div>
    )
}

export default WaitingForConfirmation

import React, { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import CopyImageIcon from "@/assets/copy.png"
import { AIPatientThread, authDefault, ConnectionStatus, DashboardPath, UserConnection } from "@/utils/types"
import { deleteConnection, handleConnectionRequest } from "@/services/dashboard/connections.service"
import { IoTrashOutline } from "react-icons/io5"
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader"
import { CustomToast } from "@/components/ui/CustomToast"
import { getPatientThreadIds } from "@/services/dashboard/threads.service"
import useAuthStore from "../../../../store/AuthStore"
import { useTabStore } from "../../../../store/TabStore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseRole } from "@/utils/dashboard/role"

interface IConnectionCard {
    connection: UserConnection
    setShowConnections: React.Dispatch<React.SetStateAction<boolean>>
}

const formatDate = (_date: Date) => {
    const date = new Date(_date)
    const day = date.getDate()
    const month = date.toLocaleString("default", { month: "long" })
    const year = date.getFullYear()

    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
}

const ConnectionCard = ({ connection, setShowConnections }: IConnectionCard) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()

    const router = useRouter()

    const [showUserCode, setShowUserCode] = useState(false)
    const [toastVisible, setToastVisible] = useState(false) // Manage toast visibility
    const [toastMessage, setToastMessage] = useState({ title: "", description: "", status: "success" }) // Toast message state

    const statusStyles = useMemo(() => {
        return {
            color:
                connection.connection_status === "PENDING"
                    ? "#c55f2e"
                    : connection.connection_status == "ACCEPTED"
                      ? "#027A48"
                      : "#DC2626",
            backgroundColor:
                connection.connection_status === "PENDING"
                    ? "#FFFAEB"
                    : connection.connection_status == "ACCEPTED"
                      ? "#ECFDF3"
                      : "#FEF2F2"
        }
    }, [connection.connection_status])

    const connArr = useMemo(() => connection.receiver_user_code?.split(""), [connection])
    const [handleAcceptLoading, setHandleAcceptLoading] = useState(false)
    const [handleRejectLoading, setHandleRejectLoading] = useState(false)
    const [handleRemoveLoading, setHandleRemoveLoading] = useState(false)

    const [userThreads, setUserThreads] = useState<AIPatientThread[]>([])
    const [showUserThreads, setShowUserThreads] = useState(false)

    useEffect(() => {
        const getPatientThreads = async () => {
            const threads = (await getPatientThreadIds(connection.patient.id)) as AIPatientThread[]
            setUserThreads(threads)
        }

        getPatientThreads()
    }, [])

    useEffect(() => {
        const TIMEOUT = 4000
        if (handleAcceptLoading) {
            const timer = setTimeout(() => {
                setHandleAcceptLoading(false)
            }, TIMEOUT)

            return () => clearTimeout(timer)
        }

        if (handleRejectLoading) {
            const timer = setTimeout(() => {
                setHandleRejectLoading(false)
            }, TIMEOUT)

            return () => clearTimeout(timer)
        }

        if (handleRemoveLoading) {
            const timer = setTimeout(() => {
                setHandleRemoveLoading(false)
            }, TIMEOUT)

            return () => clearTimeout(timer)
        }
    }, [handleAcceptLoading, handleRejectLoading, handleRemoveLoading])

    const handleCopyConnectionID = () => {
        navigator.clipboard
            .writeText(connection.receiver_user_code)
            .then(() => {
                // Show success toast
                setToastMessage({
                    title: "Copied!",
                    description: "Connection ID copied to clipboard",
                    status: "success"
                })
                setToastVisible(true)

                setTimeout(() => setToastVisible(false), 3000) // Hide toast after 3 seconds
            })
            .catch(err => {
                console.error("Failed to copy user code: ", err)
                // Show error toast
                setToastMessage({ title: "Error!", description: "Failed to copy the connection ID", status: "error" })
                setToastVisible(true)

                setTimeout(() => setToastVisible(false), 3000) // Hide toast after 3 seconds
            })
        setShowUserCode(false)
    }

    return (
        <div className="w-full border-[1px] p-2 rounded-[12px] mb-4 relative">
            {/* Toast Notification */}
            {toastVisible && (
                <CustomToast
                    title={toastMessage.title}
                    description={toastMessage.description}
                    status={toastMessage.status as "success" | "error"}
                    duration={3000}
                    position="top-right"
                />
            )}

            <div className="flex items-center justify-between gap-2">
                <div className="flex justify-start gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-black">
                            {auth.role === "PATIENT"
                                ? `${connection.doctor.role === "DOCTOR" ? "Dr " : ""}${connection.doctor.name}`
                                : `${connection.patient.name}`}
                        </h3>
                        <p className="text-[12px] font-semibold text-gray-400">
                            {auth.role === "PATIENT" ? parseRole(connection.doctor.role) : parseRole("PATIENT")}
                        </p>
                    </div>
                </div>
                <div
                    className="capitalize px-2 py-[3px] bg-[green] gap-[5px] font-bold rounded-full flex items-center text-[12px]"
                    style={statusStyles}>
                    <span
                        className="block w-[6px] h-[6px] rounded-full  relative"
                        style={{ background: statusStyles?.color }}></span>
                    {connection.connection_status}
                </div>
            </div>

            <div className="w-full mt-3 flex items-center justify-between">
                <p className="text-[12px] text-gray-500 font-semibold">
                    {connection.created_at && formatDate(connection.created_at)}
                </p>
                {connection.connection_status !== "REJECTED" && (
                    <>
                        {!showUserCode && (
                            <button
                                className="text-[12px] font-semibold underline text-gray-500"
                                onClick={() => setShowUserCode(true)}>
                                View connection ID
                            </button>
                        )}
                        {showUserCode && (
                            <button
                                className="text-[12px] font-semibold flex items-center justify-end gap-[4px] text-black"
                                onClick={handleCopyConnectionID}>
                                <p className="underline uppercase">Copy ID</p>
                                <span className="flex w-4 h-4 relative">
                                    <Image src={CopyImageIcon} alt="Copy Image Icon" fill />
                                </span>
                            </button>
                        )}
                    </>
                )}
            </div>

            {showUserCode && connection.connection_status !== ConnectionStatus.REJECTED && (
                <div className="w-full grid grid-cols-8 gap-[3px] mt-3">
                    {connArr?.map((item, index) => (
                        <div
                            className="w-full flex items-center justify-center h-8 text-sm font-bold rounded-[10px] shadow-md border-[1px]"
                            key={index}>
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {userThreads.length > 0 &&
                connection.connection_status === ConnectionStatus.ACCEPTED &&
                auth.role !== "PATIENT" && (
                    <Link
                        href="/dashboard/diagnosis"
                        onClick={() => {
                            setShowConnections(false)

                            const temp = {
                                ...userThreads[0],
                                connection: connection
                            }

                            // need to initiate thread -> summary on diagnosis page
                            localStorage.setItem("aip_t", JSON.stringify(temp))
                            localStorage.removeItem("diag")
                            window.dispatchEvent(new Event("storage"))

                            // handleSetActiveTabEvent()
                        }}
                        className="mt-3 flex justify-center items-center w-full h-8
                            bg-green-700 text-white rounded-md text-sm font-semibold">
                        <p className="flex items-center justify-center">Generate Diagnosis</p>
                    </Link>
                )}

            <div className="pt-2">
                {connection.connection_status === ConnectionStatus.ACCEPTED &&
                    auth.user_code === connection.doctor.user_code && (
                        <Link
                            href="/dashboard/import"
                            onClick={() => {
                                setShowConnections(false)
                                localStorage.setItem("aip_id", connection.patient.id)
                                // window.dispatchEvent(new Event("storage"))
                                // setActiveTab(DashboardPath.ImportSummary)

                                // window.history.pushState(
                                //     null,
                                //     "Import Patient Summary",
                                //     `/dashboard${DashboardPath.ImportSummary}`
                                // )
                            }}
                            className="flex justify-center items-center w-full h-8
                            bg-blue-500 text-white rounded-md text-sm font-semibold">
                            <p className="flex items-center justify-center">View Patient Data</p>
                        </Link>
                    )}

                {(connection.connection_status === ConnectionStatus.ACCEPTED ||
                    auth.user_code === connection.doctor.user_code) && (
                    <button
                        onClick={() => {
                            setHandleRemoveLoading(true)
                            deleteConnection(
                                auth.role === "PATIENT" ? connection.doctor.user_code : connection.patient.user_code
                            )
                        }}
                        className="flex justify-center items-center w-full h-8 border-[1px] border-gray-700 rounded-md text-sm font-semibold mt-3">
                        {handleRemoveLoading ? (
                            <SquircleLoader size={20} speed={1.1} stroke={3} color={"#212121"} />
                        ) : (
                            "Remove Connection"
                        )}
                    </button>
                )}

                {connection.connection_status === ConnectionStatus.PENDING &&
                    auth.user_code !== connection.doctor.user_code && (
                        <div className="flex justify-between gap-2 items-center h-8">
                            <button
                                onClick={() => {
                                    setHandleAcceptLoading(true)
                                    handleConnectionRequest("accept", connection.doctor.user_code)
                                }}
                                className="h-full flex-1 bg-blue-500 text-gray-100 rounded-md">
                                <p className="flex items-center justify-center">
                                    {handleAcceptLoading ? (
                                        <SquircleLoader size={20} speed={1.1} stroke={3} color={"white"} />
                                    ) : (
                                        "Accept"
                                    )}
                                </p>
                            </button>

                            <div
                                onClick={() => {
                                    setHandleRejectLoading(true)
                                    handleConnectionRequest("reject", connection.doctor.user_code)
                                }}
                                role="button"
                                className="h-full w-8 p-1 rounded-md flex justify-center items-center bg-rose-100 text-red-700">
                                {handleRejectLoading ? (
                                    <SquircleLoader size={20} speed={1.1} stroke={3} color={"white"} />
                                ) : (
                                    <IoTrashOutline size={20} />
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}

export default ConnectionCard

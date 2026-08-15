import React, { useEffect, useState, useRef } from "react"
import { IoClose } from "react-icons/io5"
import { RiSearchLine } from "react-icons/ri"
import { GoCopy } from "react-icons/go"
import ConnectionCard from "./ConnectionCard"
import { authDefault, DashboardPath, UserConnection } from "@/utils/types"
import { getAllConnections } from "@/services/dashboard/connections.service"
import { CustomToast } from "@/components/ui/CustomToast"
import useAuthStore from "../../../../store/AuthStore"
import { useTabStore } from "../../../../store/TabStore"
import useCloseModalOnOutsideClicked from "@/utils/hooks/useCloseModalOnOutsideClicked"

const Connections = ({
    connections,
    setConnections,
    setShowConnections
}: {
    connections: UserConnection[] | null
    setConnections: React.Dispatch<React.SetStateAction<UserConnection[] | null>>
    setShowConnections: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    const { auth, setAuth, resetAuth } = useAuthStore()
    const { activeTab, setActiveTab } = useTabStore()

    const [toastVisible, setToastVisible] = useState(false)
    const [toastMessage, setToastMessage] = useState({
        title: "",
        description: "",
        status: "success"
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredConnections, setFilteredConnections] = useState<UserConnection[] | null>(null)

    const connectionsListRef = useRef<HTMLDivElement>(null)
    useCloseModalOnOutsideClicked(connectionsListRef, () => setShowConnections(false))

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const fetchedConnections = await getAllConnections()
                setConnections(fetchedConnections)
                setFilteredConnections(fetchedConnections) // Initialize with all connections
            } catch (error) {
                console.error("Failed to fetch connections:", error)
            }
        }

        fetchConnections()
        const intervalId = setInterval(fetchConnections, 5000)
        return () => clearInterval(intervalId)
    }, [setConnections])

    useEffect(() => {
        if (connections) {
            const lowerSearchTerm = searchTerm.toLowerCase()

            if (lowerSearchTerm === "") {
                // If search term is cleared, maintain the last filtered connections
                setFilteredConnections(prev => prev ?? connections)
                return
            }

            const filtered = connections.filter(connection => {
                const doctorName = connection.doctor?.name?.toLowerCase() || ""
                const patientName = connection.patient?.name?.toLowerCase() || ""

                // Match either the doctor or patient's name
                return doctorName.includes(lowerSearchTerm) || patientName.includes(lowerSearchTerm)
            })

            setFilteredConnections(filtered)
        }
    }, [searchTerm, connections])

    const handleClearSearch = () => {
        setSearchTerm("")
        setFilteredConnections(connections) // Reset to all connections
    }

    const handleCopyCode = () => {
        navigator.clipboard
            .writeText(auth.user_code)
            .then(() => {
                setToastMessage({
                    title: "Copied!",
                    description: "Your code has been copied to the clipboard.",
                    status: "success"
                })
                setToastVisible(true)
                setTimeout(() => setToastVisible(false), 3000)
            })
            .catch(err => {
                console.error("Failed to copy user code:", err)
                setToastMessage({
                    title: "Error!",
                    description: "Failed to copy the code.",
                    status: "error"
                })
                setToastVisible(true)
                setTimeout(() => setToastVisible(false), 3000)
            })
    }

    return (
        <aside className="z-50 fixed top-0 md:right-2 w-full h-screen overflow-y-auto backdrop-blur-sm">
            <div
                ref={connectionsListRef}
                className="relative mx-auto md:ml-0 md:absolute  md:right-2 top-5 md:top-0 bottom-0 my-auto pb-6 w-[95%] md:w-1/2
                           lg:max-w-[28rem] lg:w-[27%] border-[1px] h-auto max-h-[calc(100%-32px)] bg-white rounded-[10px]  overflow-y-auto">
                <div className="sticky top-0 left-0 bg-white z-[3] border-b-[1px] w-full px-4 py-2 flex items-center justify-between">
                    <h3 className="font-bold text-2xl">
                        Connected {["DOCTOR", "PHARMACY"].includes(auth.role) ? "Patients" : "Doctors"}
                    </h3>
                    <button
                        className="w-8 h-8 flex items-center justify-center"
                        onClick={() => setShowConnections(false)}>
                        <IoClose className="text-2xl" />
                    </button>
                </div>

                <main className="px-4 mt-2">
                    {toastVisible && (
                        <CustomToast
                            title={toastMessage.title}
                            description={toastMessage.description}
                            status={toastMessage.status as "success" | "error"}
                            duration={3000}
                            position="top-right"
                        />
                    )}

                    <div className="flex justify-between mb-2">
                        <p className="text-gray-500">Your code:</p>
                        <p
                            onClick={handleCopyCode}
                            className="text-gray-600 font-semibold flex gap-2 items-center cursor-pointer">
                            <span className="tracking-widest">{auth.user_code}</span>
                            <GoCopy size={15} />
                        </p>
                    </div>

                    <div className="w-full mb-4 flex items-center gap-2">
                        <div className="w-full bg-[#F7F9FC] text-[#8C96A5] px-2 rounded-[10px] flex items-center">
                            <RiSearchLine className="h-6 w-6" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full px-2 py-2 bg-transparent focus:outline-none"
                                placeholder={`Find ${Array.from(["DOCTOR", "PHARMACY"]).includes(auth.role) ? "client" : "clinician"}`}
                            />
                        </div>
                        <button onClick={handleClearSearch} className="text-sm text-blue-500 hover:underline">
                            Clear
                        </button>
                    </div>

                    <div>
                        {filteredConnections && filteredConnections.length > 0 ? (
                            filteredConnections.map((connection, index) => (
                                <ConnectionCard
                                    key={index}
                                    connection={connection}
                                    setShowConnections={setShowConnections}
                                />
                            ))
                        ) : (
                            <p className="text-center text-gray-500">No connections found.</p>
                        )}
                    </div>
                </main>
            </div>
        </aside>
    )
}

export default Connections

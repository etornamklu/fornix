import React, { useEffect, useRef, useState } from "react"
import { IoClose } from "react-icons/io5"
import { FiSearch } from "react-icons/fi"
import Image from "next/image"
import { getAllConnections } from "@/services/dashboard/connections.service"
import { useSelectedPatientStore } from "../../../../store/SelectedPatientStore"
import { usePatientFormStore } from "../../../../store/patientFormStore"
import { UserConnectionsUser } from "@/utils/types"
import { motion } from "framer-motion"
import useCloseOnEsc from "@/utils/hooks/useCloseOnEsc"
import useCloseModalOnOutsideClicked from "@/utils/hooks/useCloseModalOnOutsideClicked"

const ConnectionList = ({
    isModalOn,
    closeModal,
    stepToNextPage,
    onPatientSelect
}: {
    isModalOn: boolean
    closeModal: () => void
    stepToNextPage: (number: number) => void
    onPatientSelect?: (patient: UserConnectionsUser) => void
}) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const connectionListRef = useRef<HTMLDivElement>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [connectedPatients, setConnectedPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchResults, setSearchResults] = useState<any[]>([])

    const clearUsePatientForm = usePatientFormStore(state => state.clearForm)

    useCloseOnEsc(closeModal)
    useCloseModalOnOutsideClicked(connectionListRef, () => {
        closeModal()
    })

    const handleIconClick = () => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    // anmimating component on mount
    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    // format created at to day, month, year and time
    const formatDate = (date: string) => {
        const d = new Date(date)
        return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}, ${d.getFullYear()} . ${d.toLocaleTimeString()}`
    }

    // capitalzie first letter of a string
    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
    }

    const fectchConnectedPatients = async () => {
        // Fetch connected patients here
        setLoading(true)
        setError(null)
        setSearchResults([])
        setConnectedPatients([])
        try {
            const patients = await getAllConnections()
            setConnectedPatients(patients)
        } catch (error) {
            console.log("Error :: " + error)
            setError("Error getting connections")
        } finally {
            setLoading(false)
        }
    }

    const handleRetry = () => {
        fectchConnectedPatients()
    }

    const handlePatientSelected = (patient: UserConnectionsUser) => {
        onPatientSelect?.(patient)
        clearUsePatientForm()
        stepToNextPage(1)
        closeModal()
    }

    useEffect(() => {
        if (isModalOn) {
            fectchConnectedPatients()
        }
    }, [isModalOn])

    useEffect(() => {
        if (searchQuery) {
            const results = connectedPatients.filter(patient =>
                patient.patient.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setSearchResults(results)
        } else {
            setSearchResults(connectedPatients)
        }
    }, [searchQuery, connectedPatients])

    const PatientCard = ({ name, status, dateTime }: { name: string; status: string; dateTime: string }) => {
        return (
            <div className="flex flex-col gap-3 border border-gray-300 py-2 px-2 rounded-lg hover:bg-blue-100 hover:border-blue-400 cursor-pointer transition all .1s ease">
                <div className="flex place-items-center gap-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white font-bold text-lg">
                        {name.charAt(0)}
                    </div>
                    <div className="flex flex-col ">
                        <p className="font-[500] text-slate-900">{name}</p>
                        <p className={`text-sm text-gray-500`}>{capitalizeFirstLetter(status)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-[13px]">{dateTime}</div>
            </div>
        )
    }

    if (!isModalOn) return null

    return (
        // modal
        <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeAnimation}
            transition={{ duration: 0.1, ease: "easeIn" }}
            className="fixed inset-0 z-50 flex items-center justify-center ">
            {/* Backdrop with blur effect */}
            <div className="absolute inset-0 bg-slate-300 bg-opacity-50 backdrop-blur-md" />

            {/* modal content */}
            <div
                className="absolute top-20 bottom-3 left-2 right-2 sm:right-3 sm:top-3 sm:bottom-1 sm:left-auto bg-white w-auto sm:max-w-[380px] px-3 py-5 sm:p-5 rounded-lg shadow-lg flex flex-col gap-8"
                ref={connectionListRef}>
                {/* modal header */}
                <div className="flex place-items-center justify-between">
                    {/* conversation list */}
                    <h1 className="font-[700] text-slate-900 sm:text-3xl tracking-tighter">Connected Patients</h1>
                    {/* close modal */}
                    <div
                        className="cursor-pointer hover:bg-gray-100 h-7 w-7 rounded-full flex justify-center place-items-center transition-all .1s ease"
                        onClick={closeModal}>
                        <IoClose size={24} />
                    </div>
                </div>

                {/* search conversation list */}
                <div className="w-full relative">
                    <FiSearch
                        size={24}
                        className="text-gray-500 h-5 w-5 absolute top-[15px] left-4"
                        onClick={handleIconClick}
                    />
                    <input
                        type="text"
                        ref={inputRef}
                        placeholder="Find patient"
                        className="w-full bg-gray-100 h-[50px] px-3 rounded-md focus:outline-none focus:shadow-md pl-12 text-gray-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* lists on connected patients */}
                <div className="flex flex-col gap-3 max-h-[80%] overflow-y-scroll">
                    {
                        <>
                            {searchResults && searchResults.length > 0 ? (
                                searchResults.map((patient, index) => (
                                    <div key={index} onClick={() => handlePatientSelected(patient.patient)}>
                                        <PatientCard
                                            name={patient.patient.name}
                                            dateTime={formatDate(patient.created_at)}
                                            status={patient.patient.role}
                                        />
                                    </div>
                                ))
                            ) : loading ? (
                                <div>
                                    <p className="w-full text-center">Loading...</p>
                                </div>
                            ) : searchResults.length == 0 && error === null ? (
                                <div>
                                    <p className="w-full text-center">No connected patients</p>
                                </div>
                            ) : (
                                error && (
                                    <div className="w-full flex flex-col place-items-center justify-center gap-1">
                                        <p className="w-full text-center text-red-500">{error}</p>
                                        <button className="px-3 py-1" onClick={handleRetry}>
                                            retry
                                        </button>
                                    </div>
                                )
                            )}
                        </>
                    }
                </div>
            </div>
        </motion.div>
    )
}

export default ConnectionList

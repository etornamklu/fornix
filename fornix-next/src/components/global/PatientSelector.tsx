import React, { useState } from "react"
import Button from "@/components/global/Button"
import { UserConnectionsUser } from "@/utils/types"
import { CgClose } from "react-icons/cg"

import { useSelectedPatientStore } from "../../../store/SelectedPatientStore"
import ConnectionList from "../dashboard/conversation/ConnnectionList"
import { FaUserPlus } from "react-icons/fa6"

interface PatientSelectorProps {
    className?: string
    buttonClassName?: string
    selectedPatient?: UserConnectionsUser | null
    onPatientClear?: () => void
    onPatientSelect?: (patient: UserConnectionsUser) => void
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
    className = "",
    buttonClassName = "",
    selectedPatient,
    onPatientSelect,
    onPatientClear
}) => {
    const [openConnectionListModal, setOpenConnectionListModal] = useState(false)

    return (
        <>
            <div className={`w-full flex flex-col sm:flex-row items-center justify-center ${className}`}>
                {!selectedPatient ? (
                    <Button
                        variant="outline"
                        className={`px-3 sm:px-2 py-2 text-[14px] text-gray-500 bg-transparent hover:bg-slate-300 transition-all .1s border border-[#D0D5DD] ${buttonClassName}`}
                        onClick={() => {
                            setOpenConnectionListModal(true)
                        }}>
                        <span className="sm:hidden">
                            <FaUserPlus size={18}/>
                        </span>
                        <span className="hidden sm:inline">Select patient from connection list</span>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className={`px-3 sm:px-2 py-2 text-[14px] text-blue-500 bg-blue-50 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all .1s border border-blue-200 flex items-center gap-2 ${buttonClassName}`}
                        onClick={() => {
                            onPatientClear?.()
                        }}>
                        <span className="hidden sm:flex items-center gap-1 min-w-0 flex-1">
                            <span className="whitespace-nowrap">Patient:</span>
                            <span className="font-bold truncate">{selectedPatient.name}</span>
                        </span>
                        <span className="sm:hidden text-blue-500">
                            <FaUserPlus size={18}/>
                        </span>
                        <span className="text-rose-400 font-bold flex-shrink-0">
                            <CgClose />
                        </span>
                    </Button>
                )}
            </div>

            <ConnectionList
                isModalOn={openConnectionListModal}
                closeModal={() => setOpenConnectionListModal(false)}
                stepToNextPage={() => {
                    setOpenConnectionListModal(false)
                }}
                onPatientSelect={patient => {
                    onPatientSelect?.(patient)
                    setOpenConnectionListModal(false)
                }}
            />
        </>
    )
}

export default PatientSelector

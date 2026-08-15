import React from "react"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import { DoctorDashboardDiagnosis } from "@/utils/types"

interface DiagnosisHistoryListProps {
    diagnoses: DoctorDashboardDiagnosis[]
    onItemClick: (diagnosis: DoctorDashboardDiagnosis) => void
    hasSelectedPatients: boolean
}

export const DiagnosisHistoryList: React.FC<DiagnosisHistoryListProps> = ({
    diagnoses,
    onItemClick,
    hasSelectedPatients
}) => {
    if (!diagnoses) {
        return null
    }

    if (diagnoses.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4">
                {hasSelectedPatients ? "No diagnoses found for selected patients." : "No diagnoses found."}
            </div>
        )
    }

    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {diagnoses.map((patient, index) => (
                <div
                    key={index}
                    onClick={e => {
                        e.stopPropagation()
                        onItemClick(patient)
                    }}
                    role="button"
                    className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none">
                    {patient.name}
                    <div className="flex text-gray-400 justify-center items-center hover:text-black p-2 rounded-full">
                        <CgArrowsExpandUpRight size={23} />
                    </div>
                </div>
            ))}
        </div>
    )
}

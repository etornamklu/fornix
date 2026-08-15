import React, { useEffect, useState } from "react"
import { HiOutlineDotsVertical } from "react-icons/hi"
import { getPatientQuestionnaireHistory } from "@/services/dashboard/patient_history.service"
import { useQuestionnaireHistoryStore } from "../../../../store/questionaireHistoryStore"
import { DashboardPath, QuestionnaireHistoryType } from "@/utils/types"
import { useRouter } from "next/navigation"

interface Props {
    closeSideMenu?: () => void
    diagnosisHistory: QuestionnaireHistoryType[] | null
}

const DiagnosisHistoryList = ({ closeSideMenu, diagnosisHistory }: Props) => {
    const { setQuestionnaireId } = useQuestionnaireHistoryStore()
    const router = useRouter()

    function formatDateToYearMonthDay(isoDateString: string) {
        const date = new Date(isoDateString)

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0") // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    return (
        <div className="mt-4 text-xs overflow-y-auto">
            {diagnosisHistory &&
                diagnosisHistory.length > 0 &&
                diagnosisHistory.map(({ thread_id, created_at }, index) => (
                    <div
                        key={index}
                        onClick={e => {
                            setQuestionnaireId(thread_id)
                            router.push(`/dashboard${DashboardPath.Condition}`)
                            if (closeSideMenu) {
                                closeSideMenu()
                            }
                        }}
                        className="flex justify-between items-center text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none cursor-pointer">
                        {formatDateToYearMonthDay(created_at)}
                        <div className="flex text-gray-400 justify-center items-center hover:text-black hover:bg-gray-200 p-2 rounded-full">
                            <HiOutlineDotsVertical size={25} />
                        </div>
                    </div>
                ))}
        </div>
    )
}

export default DiagnosisHistoryList

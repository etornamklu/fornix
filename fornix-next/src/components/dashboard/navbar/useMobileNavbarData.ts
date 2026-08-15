import { useMemo } from "react"
import {
    DashboardPath,
    DoctorDashboardDiagnosis,
    MedFindHistoryItem,
    PatientMedFindHistoryItem,
    QuestionnaireHistoryType,
    UserConnectionsUser
} from "@/utils/types"
import useAuthStore from "../../../../store/AuthStore"

interface MobileNavbarDataProps {
    activeTab: DashboardPath
    patientHistoryList: DoctorDashboardDiagnosis[] | null
    medFindHistoryList?: MedFindHistoryItem[] | null
    patientMedFindHistoryList?: PatientMedFindHistoryItem[] | null
    questionnaireHistoryList: QuestionnaireHistoryType[] | null
    selectedPatients: UserConnectionsUser[]
}

export const useMobileNavbarData = ({
    activeTab,
    patientHistoryList,
    medFindHistoryList,
    patientMedFindHistoryList,
    questionnaireHistoryList,
    selectedPatients
}: MobileNavbarDataProps) => {
    const { auth } = useAuthStore()

    const filteredDiagnosisList = useMemo(() => {
        if (!patientHistoryList) return []
        if (selectedPatients.length === 0) {
            return patientHistoryList
        }
        const selectedPatientIds = selectedPatients.map(p => p.id).filter(Boolean)
        return patientHistoryList.filter(
            diagnosis => diagnosis.patient_id && selectedPatientIds.includes(diagnosis.patient_id)
        )
    }, [patientHistoryList, selectedPatients])

    const availableSearchData: any[] = useMemo(() => {
        if (auth.role === "PATIENT") {
            if (activeTab === DashboardPath.PatientMedFind && patientMedFindHistoryList?.length) {
                return patientMedFindHistoryList
            } else if (activeTab !== DashboardPath.PatientMedFind && questionnaireHistoryList?.length) {
                return questionnaireHistoryList
            }
        } else if (["DOCTOR", "PHARMACY"].includes(auth.role)) {
            if (activeTab === DashboardPath.MedFind && medFindHistoryList?.length) {
                return medFindHistoryList
            } else if (activeTab !== DashboardPath.MedFind) {
                if (activeTab === DashboardPath.Diagnosis || activeTab === DashboardPath.Base) {
                    return filteredDiagnosisList
                }
                return patientHistoryList || []
            }
        }
        return []
    }, [
        auth.role,
        activeTab,
        patientMedFindHistoryList,
        questionnaireHistoryList,
        medFindHistoryList,
        patientHistoryList,
        filteredDiagnosisList
    ])

    return { availableSearchData, filteredDiagnosisList }
}

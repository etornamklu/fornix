import {Dispatch, SetStateAction, useEffect} from "react";
import {getAllDiagnoses} from "@/services/dashboard/patient_history.service";

const usePatientHistoryEffect = (setPatientHistoryList: Dispatch<SetStateAction<any>>) => {
    const fetchList = async () => {
        try {
            const diagnosesList = await getAllDiagnoses()
            // setPatientHistoryList(diagnosesList ?? [])
            setPatientHistoryList((prevList: any[]) => diagnosesList ?? prevList)
        } catch (err) {
            console.log(err)
        }
    }
    useEffect(() => {
        fetchList()
    }, [])

    return fetchList
}

export default usePatientHistoryEffect
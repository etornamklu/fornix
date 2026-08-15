import {Dispatch, SetStateAction, useEffect} from "react";
import {getDoctorMedFindThreads} from "@/services/dashboard/threads.service";

const useMedFindHistoryEffect = (setMedFindHistoryList: Dispatch<SetStateAction<any>>) => {
    const fetchMedFindHistoryList = async () => {
        try {
            const mfhList = await getDoctorMedFindThreads()
            // console.log(mfhList)
            setMedFindHistoryList((prevList: any[]) => mfhList ?? prevList)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchMedFindHistoryList()
    }, [])

    return fetchMedFindHistoryList
}

export default useMedFindHistoryEffect
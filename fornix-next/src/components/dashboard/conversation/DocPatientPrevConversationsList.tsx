import React, { useEffect } from "react"
import usePatientTranscriptStore from "../../../../store/Doc-patient-transcript"
import { formatMedFindDate } from "../Navbar"
import { CgArrowsExpandUpRight } from "react-icons/cg"
import useConversationPageRouteStore from "../../../../store/ConversationPageRouteStore"
import { useRouter, useSearchParams } from "next/navigation"
import { useAudioStore } from "../../../../store/AudioStore"

type Props = {
    closeMobileView?: () => void
}

const DocPatientPrevConversationsList = ({ closeMobileView }: Props) => {
    const { fetchTranscripts, transcripts, error, setSelectedTranscriptId } = usePatientTranscriptStore()
    const setStep = useConversationPageRouteStore(state => state.setStep)
    const clearAudio = useAudioStore(state => state.clearAudioBlob)
    const router = useRouter()

    const searchParamId = useSearchParams().get("transcriptId")

    useEffect(() => {
        fetchTranscripts()
    }, [])

    const handleOnclick = (transcriptId: string) => {
        //clear audio file if there's any in the audio state to prevent transcribing it.
        clearAudio()
        //route to where to display the selected transcript.
        setStep(2)
        setSelectedTranscriptId(transcriptId)

        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set("transcriptId", transcriptId)
        router.push(currentUrl.toString())

        //close mobile modal if in mobile view
        if (closeMobileView) closeMobileView()
    }

    return (
        <div>
            {error ? (
                <div>There was an error fetching the transcripts. Please try again later.</div>
            ) : transcripts.length > 0 ? (
                <ul className="pt-1">
                    {transcripts.map((transcript, index) => (
                        <li
                            className={`flex justify-between items-center text-xs text-gray-600 p-1 2xl:p-3 rounded-lg
                                hover:font-semibold hover:bg-gray-100 select-none cursor-pointer
                                ${searchParamId === transcript.id ? "bg-gray-200" : ""}`}
                            key={index}
                            onClick={() => handleOnclick(transcript.id)}>
                            {/*{formatMedFindDate(transcript?.updated_at)}*/}
                            {transcript.name}
                            <div
                                className="flex text-gray-400 justify-center items-center hover:text-black
                                                            p-2 rounded-full">
                                <CgArrowsExpandUpRight size={23} />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-gray-500 pt-2"></div>
            )}
        </div>
    )
}

export default DocPatientPrevConversationsList

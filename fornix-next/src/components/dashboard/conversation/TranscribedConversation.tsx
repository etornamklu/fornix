import { ITranscribedConversation } from "./ConversationResult"
import Message from "./Message"
import { useTranscriptionStore } from "../../../../store/transcriptionStore"
import LoadingDiagnosis from "@/components/dashboard/patient_diagnosis/generate_diagnosis/LoadingDiagnosis"

interface ITranscribedProps {
    downloadRef: React.RefObject<HTMLDivElement>
    transcribedConvo: ITranscribedConversation[] | null
    error: string | null
    retry: () => void
}

const TranscribedConversation = ({ downloadRef, transcribedConvo, error, retry }: ITranscribedProps) => {
    const { isLoading, stateMessage } = useTranscriptionStore()

    return (
        <div className="px-2 rounded-2xl flex-1 h-full overflow-y-auto pb-8" ref={downloadRef}>
            <div className="bg-white shadow-md p-4 rounded-2xl flex flex-col gap-4 min-h-96">
                <h2 className="text-xl font-[700] mb-4">Transcription</h2>

                {isLoading && <LoadingDiagnosis loadingText={stateMessage ?? "Loading..."} size={48} />}

                {error && (
                    <div className="font-medium w-full h-full flex justify-center items-center">
                        <div className="text-center py-4">
                            <p className="text-red-500">{error}</p>
                            <button
                                className="py-2 px-4 bg-gray-400 rounded-lg hover:bg-gray-500 text-white"
                                onClick={retry}>
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {!isLoading &&
                    !error &&
                    transcribedConvo &&
                    transcribedConvo.map(({ speaker, message }, index) => (
                        <Message key={index} index={index} sender={speaker} text={message} />
                    ))}

                {(transcribedConvo === null || transcribedConvo?.length === 0) && !isLoading && !error && (
                    <div className="w-full h-full flex justify-center place-items-center">
                        <p className="text-gray-500">No transcribed conversation available</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TranscribedConversation

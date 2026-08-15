import { ChangeEvent, Dispatch, SetStateAction, useState, useCallback } from "react"
import { LuStethoscope } from "react-icons/lu"
import { formPartData } from "@/utils/dashboard/diagnosis"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { VoiceRecorder } from "./VoiceRecorder"
import { StreamSummaryFromVoice } from "@/services/dashboard/diagnosis.service"

export const PatientDataForm = ({
    handleGenerateDiagnosis,
    handleVoiceDiagnosis,
    textValues,
    setTextValues
}: {
    handleGenerateDiagnosis: () => void
    handleVoiceDiagnosis: (audioBlob: Blob) => void
    textValues: string[]
    setTextValues: Dispatch<SetStateAction<string[]>>
}) => {
    const [templateStep, setTemplateStep] = useState(0)
    const [isVoiceMode, setIsVoiceMode] = useState(false)

    const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setTextValues([event.target.value])
    }

    const nextTemplateStep = () => {
        setTemplateStep(prev => (prev + 1) % (formPartData.length + 1))
    }

    const prevTemplateStep = () => {
        setTemplateStep(prev => (prev - 1 + (formPartData.length + 1)) % (formPartData.length + 1))
    }

    const handleVoiceRecorded = useCallback(
        (blob: Blob) => {
            console.log("🎵 handleVoiceRecorded called with blob:", blob)
            // Send audio to backend for voice-based diagnosis
            console.log("🚀 Triggering handleVoiceDiagnosis")
            handleVoiceDiagnosis(blob)
            setIsVoiceMode(false)
        },
        [handleVoiceDiagnosis]
    )

    const handleRecordingStart = useCallback(() => {
        console.log("🎬 handleRecordingStart called")
        setIsVoiceMode(true)
    }, [])

    const handleRecordingStop = useCallback(() => {
        console.log("⏹️ handleRecordingStop called")
        setIsVoiceMode(false)
    }, [])

    return (
        <div className="flex flex-col w-full lg:w-[560px] gap-4 justify-center items-center">
            {/* Template Guide Carousel - Compact */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 w-full">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-blue-800">
                        Template Guide - Step {templateStep + 1} of {formPartData.length + 1}
                    </h3>
                    <div className="flex gap-1">
                        <button
                            onClick={e => {
                                e.stopPropagation()
                                prevTemplateStep()
                            }}
                            className="p-1 rounded-full hover:bg-blue-200 transition-colors"
                            title="Previous step">
                            <FaChevronLeft className="text-blue-600 text-xs" />
                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation()
                                nextTemplateStep()
                            }}
                            className="p-1 rounded-full hover:bg-blue-200 transition-colors"
                            title="Next step">
                            <FaChevronRight className="text-blue-600 text-xs" />
                        </button>
                    </div>
                </div>
                <div className="text-xs text-blue-700">
                    {templateStep === 0 ? (
                        <>
                            <div className="font-medium mb-1">Patient Demographics</div>
                            <div className="text-blue-600 italic">
                                Include patient&apos;s age, gender, and basic demographic information. Example:
                                &quot;45-year-old male patient&quot; or &quot;32-year-old female patient&quot;
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="font-medium mb-1">{formPartData[templateStep - 1].heading}</div>
                            <div className="text-blue-600 italic">{formPartData[templateStep - 1].placeholder}</div>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col gap-3 w-full relative">
                {/* Text Area or Waveform */}
                {isVoiceMode ? (
                    <div className="w-full border border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                        <div id="voice-waveform-container" className="w-full"></div>
                    </div>
                ) : (
                    <textarea
                        value={textValues[0]}
                        onChange={handleTextareaChange}
                        name="patientHistory"
                        rows={5}
                        placeholder="Don't know what to type ? Use the guide above"
                        className="w-full outline-none border border-gray-300 rounded-lg p-4 text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pb-16"
                    />
                )}

                {/* Buttons Row - Positioned inside */}
                <div
                    className={`absolute bottom-3 w-full px-3 flex items-center ${isVoiceMode ? "justify-center" : "justify-between"}`}>
                    {/* Voice Recorder Button */}
                    <VoiceRecorder
                        onVoiceRecorded={handleVoiceRecorded}
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                    />

                    {/* Generate Diagnosis Button - Only show when not recording */}
                    {!isVoiceMode && (
                        <div
                            className="bg-blue-500 px-6 h-11 flex justify-center gap-2 items-center rounded-xl
                            text-base text-white shadow-sm border cursor-pointer hover:bg-blue-600
                            hover:text-white select-none transition-colors"
                            onClick={handleGenerateDiagnosis}>
                            <LuStethoscope size={20} />
                            <span>Generate Diagnosis</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

"use client"
import React, { Dispatch, SetStateAction, useState, useCallback } from "react"
import Styles from "../patient_diagnosis/generate_diagnosis/message.module.css"
import Button from "@/components/global/Button"
import { VoiceRecorder } from "@/components/dashboard/patient_diagnosis/VoiceRecorder"
import { StreamPatientGPTFromVoice } from "@/services/dashboard/patientgpt.service"

interface EmptyMessagesInputFieldProps {
    onGenerateClick?: () => void
    onExampleClick?: () => void
    textAreaValue: string
    setTextAreaValue: Dispatch<SetStateAction<string>>
    onVoiceRecorded?: (blob: Blob) => void
}

const EmptyMessagesInputField = ({
    onExampleClick,
    onGenerateClick,
    textAreaValue,
    setTextAreaValue,
    onVoiceRecorded
}: EmptyMessagesInputFieldProps) => {
    const [isVoiceMode, setIsVoiceMode] = useState(false)

    const handleVoiceRecorded = useCallback(
        (blob: Blob) => {
            console.log("🎵 MedFind voice recorded:", blob)
            onVoiceRecorded?.(blob)
            setIsVoiceMode(false)
        },
        [onVoiceRecorded]
    )

    const handleRecordingStart = useCallback(() => {
        console.log("🎬 MedFind recording started")
        setIsVoiceMode(true)
    }, [])

    const handleRecordingStop = useCallback(() => {
        console.log("⏹️ MedFind recording stopped")
        setIsVoiceMode(false)
    }, [])
    const examples = [
        "65-year-old woman with history of diabetes  presents with acute onset of right-sided weakness and slurred speech",
        "21-year-old man with a history of strokes presenting with confusion and disorientation"
    ]

    return (
        <div className="flex w-full h-full items-center justify-center">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-1 items-center">
                    <h2 className="text-3xl 2xl:text-5xl font-semibold text-center">How can I help you?</h2>
                    <span className="text-sm font-light text-balance text-center">
                        Ask any medical question and get instant, evidence-based answers backed by scientific
                        literature.
                    </span>
                </div>

                <div
                    className="flex flex-col rounded-xl bg-white p-2 shadow-xl outline outline-1 outline-[#CBD5E1]
                    focus-within:outline-2">
                    {isVoiceMode ? (
                        <div className="w-full border border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                            <div id="voice-waveform-container" className="w-full"></div>
                        </div>
                    ) : (
                        <textarea
                            value={textAreaValue}
                            onChange={e => setTextAreaValue(e.target.value)}
                            style={{ scrollbarWidth: "none" }}
                            title="Input"
                            rows={6}
                            className="w-full h-20 2xl:h-fit resize-none overflow-y-scroll p-2 rounded-xl focus:outline-none lg:min-w-[36rem]"
                            placeholder="Type here..."
                        />
                    )}

                    <div className={`flex items-center ${isVoiceMode ? "justify-center w-full py-4" : "justify-end"}`}>
                        {isVoiceMode || textAreaValue.length === 0 ? (
                            <VoiceRecorder
                                onVoiceRecorded={handleVoiceRecorded}
                                onRecordingStart={handleRecordingStart}
                                onRecordingStop={handleRecordingStop}
                            />
                        ) : (
                            <Button variant="primary" className="px-4 h-11" onClick={onGenerateClick}>
                                <span>Generate</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/*<div className="flex flex-col gap-2">*/}
                {/*    <p className="2xl:text-lg font-semibold text-center">Try an example</p>*/}
                {/*    <div className="flex flex-col gap-2 2xl:gap-4 2xl:max-w-2xl items-center">*/}
                {/*        {examples.map((example, index) => (*/}
                {/*            <GptPromExample*/}
                {/*                key={index}*/}
                {/*                prompt={example}*/}
                {/*                onClick={onExampleClick}*/}
                {/*            />*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </div>
    )
}

export const GptPromExample = ({ prompt, onClick }: { prompt: string; onClick?: () => void }) => {
    return (
        <div
            className={`flex h-full max-w-sm md:max-w-xl text-xs 2xl:text-sm px-4 py-2 text-black bg-white cursor-pointer rounded-xl`}
            onClick={onClick}>
            <div className={`w-full py-1 overflow-hidden`}>
                <p className={Styles.textOverflow1}>{prompt}</p>
            </div>
        </div>
    )
}

export const GenerateInputField = () => {
    return <textarea title="Generate">GenerateInputField</textarea>
}

export default EmptyMessagesInputField

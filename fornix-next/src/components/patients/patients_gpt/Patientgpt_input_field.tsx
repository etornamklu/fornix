"use client"
import React, { Dispatch, SetStateAction } from "react"
import Styles from "../../dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import Button from "@/components/global/Button"

interface PatientEmptyMessagesInputFieldProps {
    onGenerateClick?: () => void
    onExampleClick?: () => void
    textAreaValue: string
    setTextAreaValue: Dispatch<SetStateAction<string>>
}

const PatientEmptyMessagesInputField = ({
    onExampleClick,
    onGenerateClick,
    textAreaValue,
    setTextAreaValue
}: PatientEmptyMessagesInputFieldProps) => {
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
                        MedFind lets you ask questions about your health—like what your symptoms might mean, what a test
                        result says, or what a medicine is for. But instead of giving general answers, it gives
                        responses tailored to your health history and what you have shared..
                    </span>
                </div>

                <div
                    className="flex flex-col rounded-xl bg-white p-2 shadow-xl outline outline-1 outline-[#CBD5E1]
                    focus-within:outline-2">
                    <textarea
                        value={textAreaValue}
                        onChange={e => setTextAreaValue(e.target.value)}
                        style={{ scrollbarWidth: "none" }}
                        title="Input"
                        rows={6}
                        className="w-full h-20 2xl:h-fit resize-none overflow-y-scroll p-2 rounded-xl focus:outline-none lg:min-w-[36rem]"
                        placeholder="Why am I feeling tired all the time even though I sleep well?"
                    />
                    <Button variant="primary" className="self-end px-4 py-2" onClick={onGenerateClick}>
                        <span>Generate</span>
                    </Button>
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

export default PatientEmptyMessagesInputField

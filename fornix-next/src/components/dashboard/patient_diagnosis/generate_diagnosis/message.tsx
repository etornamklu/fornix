/* eslint-disable @next/next/no-img-element */
"use client"
import Styles from "@/components/dashboard/patient_diagnosis/generate_diagnosis/message.module.css"
import { Diagnosis, LogoVariants, SummaryItem } from "@/utils/types"
import React, { useState } from "react"
import { LogoAsset } from "@/components/assets/LogoAsset"
import { CiStar } from "react-icons/ci"
import { FaComment, FaRegStar, FaStar } from "react-icons/fa6"
import { IoInformationCircleOutline, IoCopyOutline } from "react-icons/io5"
import LoadingDiagnosis from "@/components/dashboard/patient_diagnosis/generate_diagnosis/LoadingDiagnosis"

export function clearClinicalItems() {
    if (typeof window !== "undefined") {
        // Get the 'diag' object from localStorage
        const diagString = localStorage.getItem("diag")

        if (diagString) {
            const diag = JSON.parse(diagString)
            diag.clinical_items = []
            localStorage.setItem("diag", JSON.stringify(diag))
        }
    }
}

// ICD Code Display Component
interface ICDCodeDisplayProps {
    condition: string
    icdCode?: string
    explanation: string
    isSelected?: boolean
    isPrimary?: boolean
    onSelect?: () => void
    index?: number
    isLessLikely?: boolean
}

// Helper function to format ICD codes nicely
const formatICDCode = (icdCode: string): string => {
    if (!icdCode) return ''

    // Remove any existing formatting and quotes
    const cleanCode = icdCode.replace(/[^\w\d.-]/g, '')

    // Handle common ICD-10 patterns
    if (cleanCode.match(/^[A-Z]\d{2}$/)) {
        // Format like A09 -> A09
        return cleanCode
    } else if (cleanCode.match(/^[A-Z]\d{2}\d+$/)) {
        // Format like J189 -> J18.9, C780 -> C78.0
        return cleanCode.substring(0, 3) + '.' + cleanCode.substring(3)
    } else if (cleanCode.match(/^[A-Z]\d{2}[A-Z]\d*$/)) {
        // Handle codes with letters in them
        return cleanCode
    }

    return cleanCode
}

// Extract ICD code from condition string
const extractICDCode = (condition: string): { condition: string; icdCode: string } => {
    // Pattern to match ICD codes in various formats including the exact format from your UI
    const patterns = [
        /["']?icd[_\s]*code["']?\s*:\s*["']?([A-Z]\d{2}\.?\d*[A-Z]?)["']?/gi,
        /\b([A-Z]\d{2}\.?\d+)\b/g // Match standalone ICD codes like "A15.9"
    ]

    for (const pattern of patterns) {
        const match = condition.match(pattern)
        if (match) {
            let icdCode = ''

            if (pattern.source.includes('icd')) {
                // Extract from "icd_code" format
                const codeMatch = match[0].match(/([A-Z]\d{2}\.?\d*[A-Z]?)/i)
                if (codeMatch) {
                    icdCode = formatICDCode(codeMatch[1])
                }
            } else {
                // Direct ICD code match
                icdCode = formatICDCode(match[0])
            }

            if (icdCode) {
                const cleanCondition = condition
                    .replace(pattern, '')
                    .replace(/[,;]\s*$/, '')
                    .replace(/^\d+\.?\s*/, '') // Remove leading numbers like "1. "
                    .replace(/["']\s*$/, '') // Remove trailing quotation marks
                    .trim()
                return { condition: cleanCondition, icdCode }
            }
        }
    }

    return {
        condition: condition
            .replace(/^\d+\.?\s*/, '') // Remove leading numbers like "1. "
            .replace(/["']\s*$/, '') // Remove trailing quotation marks
            .trim(),
        icdCode: ''
    }
}

const ICDCodeDisplay: React.FC<ICDCodeDisplayProps> = ({
                                                           condition,
                                                           icdCode: propIcdCode,
                                                           explanation,
                                                           isSelected = false,
                                                           isPrimary = false,
                                                           onSelect,
                                                           index,
                                                           isLessLikely = false
                                                       }) => {
    // Extract ICD code from condition if not provided as prop
    const { condition: cleanCondition, icdCode: extractedCode } = extractICDCode(condition)
    const finalIcdCode = propIcdCode || extractedCode

    const handleCopyICD = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering the onSelect
        if (finalIcdCode) {
            try {
                await navigator.clipboard.writeText(finalIcdCode)
                // You could add a toast notification here if you have a toast system
                console.log(`Copied ICD code: ${finalIcdCode}`)
            } catch (err) {
                console.error('Failed to copy ICD code:', err)
                // Fallback for older browsers
                const textArea = document.createElement('textarea')
                textArea.value = finalIcdCode
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            }
        }
    }

    return (
        <div className="flex">
            {index !== undefined && (
                <div className="text-xs font-light p-2 text-gray-500 italic">
                    {index + 1}
                </div>
            )}

            <div className="flex-1">
                <div
                    onClick={onSelect}
                    className="font-medium flex justify-between items-start cursor-pointer group mb-2"
                >
                    <div className="flex-1 pr-4">
                        <h4 className="text-base lg:text-lg font-medium text-gray-900 leading-tight mb-2">
                            {cleanCondition}
                        </h4>

                        {/* ICD Code Badge with Copy functionality */}
                        {finalIcdCode && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500
                rounded-full text-xs font-medium text-white mb-2 group/icd-badge">
                                <span className="uppercase tracking-wide">ICD-10: {finalIcdCode}</span>
                                <div className="flex items-center gap-1">
                                    {/*<IoInformationCircleOutline size={14} className="text-blue-100" />*/}
                                    <button
                                        onClick={handleCopyICD}
                                        className="p-0.5 rounded hover:bg-blue-400 transition-colors duration-200
                             opacity-70 hover:opacity-100 focus:outline-none focus:ring-1
                             focus:ring-blue-300"
                                        title={`Copy ${finalIcdCode}`}
                                        aria-label={`Copy ICD code ${finalIcdCode}`}
                                    >
                                        <IoCopyOutline size={12} className="text-blue-100" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Less Likely indicator */}
                        {isLessLikely && (
                            <div className="text-sm text-gray-600 font-medium mb-2">
                                Less Likely
                            </div>
                        )}
                    </div>

                    {onSelect && (
                        <div className="flex-shrink-0 ml-2" role="button">
                            {isSelected ? (
                                <div className="flex items-center relative">
                                    {isPrimary && (
                                        <p className="absolute right-6 text-[0.6rem] tracking-wider uppercase
                      bg-blue-400 text-white px-2 rounded-full">
                                            primary
                                        </p>
                                    )}
                                    <FaStar size={18} className="text-blue-400" />
                                </div>
                            ) : (
                                <FaRegStar size={18} className="text-gray-400 hover:text-gray-600" />
                            )}
                        </div>
                    )}
                </div>

                <div className="text-gray-700 text-sm lg:text-base leading-relaxed">
                    {explanation}
                </div>
            </div>
        </div>
    )
}

const MessagesField = ({ children }: Readonly<{ children?: React.ReactNode }>) => {
    return <div className="flex flex-col gap-8 w-full h-full p-4 rounded-2xl relative">{children}</div>
}

type MessageProps = { message: string | null; rawSummary: string } & MessageAvatarProps

const SendSummary = ({ message, rawSummary, avatar }: MessageProps) => {
    const [fullHeight, setFullHeight] = useState(false)
    return (
        <div className="flex flex-col gap-2">
            <MessageAvatar user={"doctor"} avatar={avatar} />
            <div className={`pl-8`}>
                <div
                    className={`text-sm lg:text-md flex h-full max-w-sm lg:max-w-2xl px-4 py-4 text-white cursor-pointer
                     rounded-xl ${!fullHeight && "max-h-28"} ${Styles.sendMessage}`}
                    onClick={() => setFullHeight(!fullHeight)}>
                    <div className={`w-full py-1 overflow-hidden`}>
                        <div className={`${!fullHeight && Styles.textOverflow}`}>
                            <div className="text-gray-50 font-medium">{message ?? rawSummary}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ReceiveDiagnosis = ({
                              diagnosis,
                              summary,
                              rawSummary,
                              primaryDiagnosisIndex,
                              setPrimaryDiagnosisIndex
                          }: {
    diagnosis: Diagnosis
    summary: string
    rawSummary: string
    primaryDiagnosisIndex: number
    setPrimaryDiagnosisIndex: React.Dispatch<React.SetStateAction<number>>
}) => {
    const [fullHeight, setFullHeight] = useState(true)
    return (
        <div className="flex flex-col gap-2 w-full">
            <MessageAvatar user={"fornix"} />
            <div className={`lg:pr-4 2xl:pr-8 md:self-end lg:min-w-full xl:min-w-[30rem]`}>
                <div
                    className={`flex h-full w-full px-4 py-4 text-black rounded-xl ${
                        !fullHeight && "max-h-28"
                    } bg-white ${Styles.receiveMessage}`}
                    // onClick={() => setFullHeight(!fullHeight)}
                >
                    <div className={`w-full py-1 overflow-hidden`}>
                        <div className={`${!fullHeight && Styles.textOverflow}`}>
                            <div className={"flex flex-col gap-1"}>
                                <p className={"font-semibold lg:text-2xl"}>
                                    {fullHeight ? "Diagnosis" : "Diagnosis and DDx"}
                                </p>
                                <p className={`text-sm lg:text-base text-gray-700`}>
                                    Comprehensive Review of the Case:
                                </p>
                                <div className="text-sm lg:text-base 2xl:text-lg">
                                    <div>{summary ?? rawSummary}</div>
                                </div>
                            </div>
                            {diagnosis?.differential_diagnosis ? (
                                <div className={"flex flex-col gap-1 mt-4 lg:mt-8"}>
                                    <p
                                        className="font-semibold tracking-wider lg:text-md 2xl:text-lg
                                        text-gray-700 uppercase mb-4">
                                        Most Likely Dx
                                    </p>

                                    <div className="mb-6">
                                        <ICDCodeDisplay
                                            condition={diagnosis.differential_diagnosis?.condition ?? ""}
                                            explanation={diagnosis.differential_diagnosis?.reasoning ?? ""}
                                            isSelected={primaryDiagnosisIndex === -1}
                                            isPrimary={primaryDiagnosisIndex === -1}
                                            onSelect={() => {
                                                setPrimaryDiagnosisIndex(prev => {
                                                    if (prev === -1) return prev
                                                    clearClinicalItems()
                                                    return -1
                                                })
                                            }}
                                        />
                                    </div>

                                    {diagnosis.alternative_diagnoses &&
                                        diagnosis.alternative_diagnoses.length > 0 && (
                                            <div>
                                                <div
                                                    className="font-semibold tracking-wider lg:text-md 2xl:text-lg
                                                    text-gray-700 uppercase mb-4">
                                                    Alternative Diagnoses
                                                </div>

                                                <div className="flex flex-col gap-6">
                                                    {diagnosis.alternative_diagnoses.map((altDiagnosis: any, index: number) => {
                                                        // Check if diagnosis is marked as less likely
                                                        const isLessLikely = typeof altDiagnosis.possible === "boolean"
                                                            ? !altDiagnosis.possible
                                                            : altDiagnosis.possible?.length && altDiagnosis.possible.charAt(0) !== "t"

                                                        return (
                                                            <ICDCodeDisplay
                                                                key={index}
                                                                index={index}
                                                                condition={altDiagnosis.condition}
                                                                explanation={altDiagnosis.explanation}
                                                                isSelected={primaryDiagnosisIndex === index}
                                                                isPrimary={primaryDiagnosisIndex === index}
                                                                isLessLikely={isLessLikely}
                                                                onSelect={() => {
                                                                    setPrimaryDiagnosisIndex(prev => {
                                                                        if (prev === index) return prev
                                                                        clearClinicalItems()
                                                                        return index
                                                                    })
                                                                }}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <LoadingDiagnosis loadingText="Preparing Diagnosis..." />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface MessageAvatarProps {
    avatar?: string
    user?: "doctor" | "patient" | "fornix"
}

export const MessageAvatar = ({ avatar, user }: MessageAvatarProps) => {
    if (user === "fornix")
        return (
            <div className={`flex w-full justify-start`}>
                <LogoAsset size={30} title={false} isMessageHeader variant={LogoVariants.primary} />
            </div>
        )

    return (
        <div className="flex justify-end gap-2 items-center">
            {/*<img*/}
            {/*    src={avatar ?? "https://picsum.photos/2800/4000"}*/}
            {/*    alt={`profile img`}*/}
            {/*    className="w-8 h-8 rounded-full"*/}
            {/*/>*/}
            <span className="text-sm font-light text-blue-400">You</span>
            {/*<CiStar size={15} />*/}
            <FaComment size={15} className="text-blue-400" />
        </div>
    )
}

export { SendSummary, ReceiveDiagnosis }

export default MessagesField
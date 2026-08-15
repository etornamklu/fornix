import { useEffect, useRef, useState } from "react"
import { storeClinicalItem, StreamClinicalCompletion } from "@/services/dashboard/diagnosis.service"
import {
    Diagnosis,
    DoctorDashboardDiagnosis,
    FollowUpResponse,
    LabResponse,
    MsrResponse,
    NonPharmResponse,
    SummaryItem
} from "@/utils/types"
import { clinicalResponseToJson } from "@/utils/dashboard/diagnosis"
import { updateDiagnosis } from "@/services/dashboard/patient_history.service"

export const ClinicalItem = ({
    clinicalKey,
    summary,
    diagnosis,
    primaryDiagnosisIndex,
    handleInsufficientCredits
}: {
    clinicalKey: { name: string; value: string }
    summary: SummaryItem[] | null | string
    diagnosis: Diagnosis
    primaryDiagnosisIndex: number
    handleInsufficientCredits: () => void
}) => {
    const [jsonClinicalResponse, setJsonClinicalResponse] = useState<
        | (
              | string
              | {
                    key: string
                    value: string
                }
          )[]
        | MsrResponse
        | LabResponse
        | FollowUpResponse
        | NonPharmResponse
    >([])
    const isMounted = useRef(false)
    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        let storedClinicalData: any | null = null

        const handleStorageChange = () => {
            // if (not showDiagnosisPage) and stored data: show diagnosis page
            const diag = JSON.parse(window.localStorage.getItem("diag") ?? "{}") as DoctorDashboardDiagnosis
            const scd = diag.clinical_items
                ? diag.clinical_items.find(obj => Object.keys(obj)[0] === clinicalKey.value)
                : null
            // storedClinicalData = window.localStorage.getItem(clinicalKey.value)
            if (scd) {
                storedClinicalData = scd[clinicalKey.value] as any
                // console.log(storedClinicalData)
                setJsonClinicalResponse(storedClinicalData)
            }
            // if (!storedClinicalData || storedClinicalData.length <= 2) storedClinicalData = null
            // else
        }

        window.addEventListener("storage", handleStorageChange)
        // check for stored clinical data
        if (typeof window !== "undefined") {
            // we want it to run on mount
            handleStorageChange()
        }

        if (
            !isMounted.current &&
            (!storedClinicalData || storedClinicalData.length == 0) &&
            summary &&
            diagnosis.differential_diagnosis.condition
        ) {
            // console.log(JSON.stringify(summary))
            const formattedData =
                typeof summary === "string" ? summary : summary.map(item => `${item.key}: ${item.value}`).join("\n")
            // console.log(formattedData)
            // stream completion
            let tempClinData: any
            StreamClinicalCompletion(
                {
                    summary: formattedData,
                    most_likely_diagnosis: `${
                        primaryDiagnosisIndex === -1 || primaryDiagnosisIndex === undefined
                            ? diagnosis.differential_diagnosis.condition
                            : diagnosis.alternative_diagnoses[primaryDiagnosisIndex].condition
                    }: 
                        ${
                            primaryDiagnosisIndex === -1 || primaryDiagnosisIndex === undefined
                                ? diagnosis.differential_diagnosis.reasoning
                                : diagnosis.alternative_diagnoses[primaryDiagnosisIndex].explanation
                        }`,

                    key: clinicalKey.value
                },
                async (message: string) => {
                    tempClinData = clinicalResponseToJson(message, clinicalKey.value)
                    setJsonClinicalResponse(tempClinData)
                    scrollToBottom()
                },
                () => {
                    const updatedDiag = storeClinicalItem(primaryDiagnosisIndex, clinicalKey, tempClinData)

                    updateDiagnosis(updatedDiag.id, {
                        clinical_items: [...updatedDiag.clinical_items],
                        primary_index: updatedDiag.primary_index
                    }).then(res => {
                        // console.log(res)
                        res && window.localStorage.setItem("diag", JSON.stringify(res))
                    })
                    // }
                    window.dispatchEvent(new Event("storage"))
                },
                handleInsufficientCredits
            )
        } else {
            // console.log('why are we here')
            // console.log(diagnosis)
            if (storedClinicalData?.length) {
                // setClinicalResponse(storedClinicalData)
                setJsonClinicalResponse(storedClinicalData)
            }
        }

        isMounted.current = true

        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [])

    return (
        <div className={"px-8 py-2 flex flex-col gap-1"}>
            {Array.isArray(jsonClinicalResponse) && (
                <span className={``}>
                    {jsonClinicalResponse.map((item, index) => (
                        <div key={index} className="mb-2">
                            {typeof item === "string" ? (
                                <div>
                                    <span className="text-xs font-light p-2 text-gray-500 italic">{index + 1}.</span>
                                    <span>{item}</span>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-xs font-light p-2 text-gray-500 italic">{index + 1}.</span>
                                    <span className={"font-mono"}>{item.key}: </span>
                                    <span className={"text-gray-700"}>{item.value}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </span>
            )}

            {jsonClinicalResponse && "follow_up_instructions" in jsonClinicalResponse && (
                <div className="flex flex-col gap-6">
                    {jsonClinicalResponse.follow_up_instructions.map((item, index) => (
                        <div key={index} className="flex gap-1">
                            <p className="text-xs font-light p-2 text-gray-500 italic">{item.instruction_number}.</p>
                            <div className="flex flex-col text-gray-700">
                                <p className="font-[500]">{item.category}</p>
                                <p className="text-sm">{item.timeframe}</p>
                                <p>{item.action}</p>
                                <div className="border-l-2 border-gray-300 pl-2 mt-1">
                                    <p>{item.clinical_rationale}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {jsonClinicalResponse && "procedural_physical_interventions" in jsonClinicalResponse && (
                <div className="flex flex-col gap-5">
                    <div>
                        <p className="font-semibold text-gray-700 uppercase tracking-wider">
                            Procedural & Physical Interventions
                        </p>
                        <div className="flex flex-col gap-2">
                            {jsonClinicalResponse.procedural_physical_interventions.map((item, index) => (
                                <div className="flex gap-1" key={index}>
                                    <span className="text-xs font-light p-2 text-gray-500 italic">{index + 1}.</span>
                                    <div className="flex flex-col gap-1">
                                        <p>{item}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {jsonClinicalResponse.supportive_device_based_therapies && (
                        <div>
                            <p className="font-semibold text-gray-700 uppercase tracking-wider">
                                Supportive & Device-Based Therapies
                            </p>
                            <div className="flex flex-col gap-2">
                                {jsonClinicalResponse.supportive_device_based_therapies.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col gap-1">
                                            <p>{item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.behavioral_lifestyle_modifications && (
                        <div>
                            <p className="font-semibold text-gray-700 uppercase tracking-wider">
                                Behavioural & Lifestyle Modifications
                            </p>
                            <div className="flex flex-col gap-2">
                                {jsonClinicalResponse.behavioral_lifestyle_modifications.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col gap-1">
                                            <p>{item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.psychosocial_support && (
                        <div>
                            <p className="font-semibold text-gray-700 uppercase tracking-wider">Psychosocial Support</p>
                            <div className="flex flex-col gap-2">
                                {jsonClinicalResponse.psychosocial_support.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col gap-1">
                                            <p>{item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {jsonClinicalResponse && "medications" in jsonClinicalResponse && (
                <div className="flex flex-col gap-5">
                    {jsonClinicalResponse.initial_management && (
                        <div>
                            <div className="font-semibold text-gray-700 uppercase tracking-wider">
                                Initial Management
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-gray-500">{jsonClinicalResponse.initial_management}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="font-semibold text-gray-700 uppercase tracking-wider">Medications</div>
                        <div className="flex flex-col gap-2">
                            {jsonClinicalResponse.medications.map((item, index) => (
                                <div className="flex gap-1" key={index}>
                                    <span className="text-xs font-light p-2 text-gray-500 italic">{index + 1}.</span>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-base font-semibold">{item.drug_name}</p>
                                        <p className="text-sm text-gray-500">{item.dose}</p>
                                        <p className="text-sm text-gray-700">{item.rationale}</p>
                                        <p className="text-sm text-gray-700">
                                            <span className="text-gray-800">Adverse Effects: </span>
                                            {item.adverse_effects?.join(", ")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {jsonClinicalResponse.surgical_intervention && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">
                                Surgical Intervention
                            </p>
                            <div className="flex flex-col gap-2">
                                {jsonClinicalResponse.surgical_intervention.procedure && (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-base font-semibold">
                                            {jsonClinicalResponse.surgical_intervention.procedure}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {jsonClinicalResponse.surgical_intervention.rationale}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.psychological_intervention && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">
                                Psychological Intervention
                            </p>
                            <div className="flex flex-col gap-2">
                                {jsonClinicalResponse.psychological_intervention && (
                                    <div>
                                        <p className="text-base font-semibold">Psychotherapy</p>
                                        {jsonClinicalResponse.psychological_intervention.psychotherapy.map(
                                            (item, index) => (
                                                <div key={index} className="flex gap-1">
                                                    <span className="text-xs font-light p-2 text-gray-500 italic">
                                                        {index + 1}.
                                                    </span>
                                                    {item}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {jsonClinicalResponse.psychological_intervention.behavioral_interventions && (
                                    <div>
                                        <p className="text-base font-semibold">Behavioral Interventions</p>
                                        {jsonClinicalResponse.psychological_intervention.behavioral_interventions.map(
                                            (item, index) => (
                                                <div key={index} className="flex gap-1">
                                                    <span className="text-xs font-light p-2 text-gray-500 italic">
                                                        {index + 1}.
                                                    </span>
                                                    {item}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {jsonClinicalResponse.psychological_intervention.rationale && (
                                    <div>
                                        <p className="text-base font-semibold">Rationale</p>
                                        <p className="text-basse text-gray-700">
                                            {jsonClinicalResponse.psychological_intervention.rationale}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.additional_notes && (
                        <div className="w-full text-gray-700 bg-gray-50 px-3 py-3 rounded-xl shadow">
                            {jsonClinicalResponse.additional_notes}
                        </div>
                    )}
                </div>
            )}

            {jsonClinicalResponse && "first_line_tests" in jsonClinicalResponse && (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col">
                        <p className="text-gray-700 font-semibold uppercase tracking-wider">First Line Tests</p>
                        <div className="flex flex-col gap-4">
                            {jsonClinicalResponse.first_line_tests.map((item, index) => (
                                <div key={index} className="flex gap-1">
                                    <span className="text-xs font-light p-2 text-gray-500 italic">{index + 1}.</span>
                                    <div className="flex flex-col text-gray-700">
                                        <p className="font-[500]">{item.name}</p>
                                        <p className="text-sm">{item.rationale}</p>
                                        {item.expected_findings && (
                                            <div className="flex flex-col text-gray-700 text-sm mt-2">
                                                <span className="text-gray-800 font-[500]">Expected Findings</span>
                                                <span>{item.expected_findings}</span>
                                            </div>
                                        )}
                                        {item.critical_values && (
                                            <div className="flex flex-col text-gray-700 text-sm mt-2">
                                                <span className="text-gray-800 font-[500]">Critical Values</span>
                                                <span>{item.critical_values}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {jsonClinicalResponse.additional_tests && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">Additional Tests</p>
                            <div className="flex flex-col gap-4">
                                {jsonClinicalResponse.additional_tests.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col text-gray-700">
                                            <p className="font-[500]">{item.name}</p>
                                            {item.when_to_order && (
                                                <div className="flex flex-col text-gray-700 text-sm mt-1">
                                                    <span className="text-gray-800 font-[500]">When To Order</span>
                                                    <span>{item.expected_findings}</span>
                                                </div>
                                            )}
                                            {item.expected_findings && (
                                                <div className="flex flex-col text-gray-700 text-sm mt-2">
                                                    <span className="text-gray-800 font-[500]">Expected Findings</span>
                                                    <span>{item.expected_findings}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.imaging_studies && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">Imaging Studies</p>
                            <div className="flex flex-col gap-4">
                                {jsonClinicalResponse.imaging_studies.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col text-gray-700">
                                            <p className="font-[500]">{item.type}</p>
                                            {item.area_of_focus && (
                                                <div className="flex flex-col text-gray-700 text-sm mt-1">
                                                    <span className="text-gray-800 font-[500]">Area Of Focus</span>
                                                    <span>{item.area_of_focus}</span>
                                                </div>
                                            )}
                                            {item.expected_findings && (
                                                <div className="flex flex-col text-gray-700 text-sm mt-2">
                                                    <span className="text-gray-800 font-[500]">Expected Findings</span>
                                                    <span>{item.expected_findings}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.specialist_consultations && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">
                                Specialist Consultations
                            </p>
                            <div className="flex flex-col gap-4">
                                {jsonClinicalResponse.specialist_consultations.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col text-gray-700">
                                            <p className="font-[500]">{item.specialty}</p>
                                            <p className="text-sm">{item.rationale}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.diagnostic_pitfalls && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">Diagnostic Pitfalls</p>
                            <div className="flex flex-col gap-1">
                                {jsonClinicalResponse.diagnostic_pitfalls.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col text-gray-700">
                                            <p className="text-sm">{item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jsonClinicalResponse.red_flags && (
                        <div className="flex flex-col">
                            <p className="text-gray-700 font-semibold uppercase tracking-wider">Red Flags</p>
                            <div className="flex flex-col gap-1">
                                {jsonClinicalResponse.red_flags.map((item, index) => (
                                    <div className="flex gap-1" key={index}>
                                        <span className="text-xs font-light p-2 text-gray-500 italic">
                                            {index + 1}.
                                        </span>
                                        <div className="flex flex-col text-gray-700">
                                            <p className="text-sm">{item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    )
}

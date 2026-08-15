import React, { useState } from "react"
import { useTranscriptionStore } from "../../../../store/transcriptionStore"
import { usePatientFormStore } from "../../../../store/patientFormStore"
import { PatientMedicalNotes } from "@/utils/types"
import { Pathway_Extreme } from "next/font/google"
import Markdown from "react-markdown"

const MedicalNotes = ({
    downloadRef,
    patientMedicalNotes,
    error,
    retry
}: {
    downloadRef: React.RefObject<HTMLDivElement>
    patientMedicalNotes: PatientMedicalNotes | null
    error: string | null
    retry: () => void
}) => {
    const { isLoading, stateMessage } = useTranscriptionStore()

    const demographics = patientMedicalNotes?.demographics || {}
    const extractedName = demographics.name || "Not provided"
    const extractedAge = demographics.age || "Not provided"
    const extractedGender = demographics.gender || "Not provided"
    const extractedResidence = demographics.residence || "Not provided"

    if (isLoading)
        return (
            <div className="flex-1 h-[300px] bg-white mx-4 mb-3 rounded-2xl flex place-items-center justify-items-center">
                <p className="w-full text-center font-medium sm:text-[18px]">
                    {stateMessage ? stateMessage : "Loading..."}
                </p>
            </div>
        )

    if (error) {
        return (
            <div className="flex-1 h-[300px]  bg-white mx-4 mb-3 rounded-2xl flex place-items-center justify-items-center">
                <div className="w-full text-center font-medium flex flex-col gap-2">
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <button
                            className="py-2 px-4 bg-gray-400 rounded-lg hover:bg-gray-500 text-white"
                            onClick={retry}>
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white flex-1 h-auto mx-2 mb-3 rounded-2xl ">
            <div className="lg:w-4/5 2xl:w-2/3 mx-auto p-6 space-y-4 bg-white rounded-lg" ref={downloadRef}>
                <h1 className="text-2xl lg:text-3xl text-gray-800 font-bold text-center mb-6">Medical History</h1>

                <div>
                    <strong className="text-xl">Demographic Details</strong>
                    <div>
                        <div>
                            <strong>Name:</strong> <span>{extractedName}</span>
                        </div>
                        <div>
                            <strong>Age:</strong> <span>{extractedAge}</span>
                        </div>
                        <div>
                            <strong>Gender:</strong> <span>{extractedGender}</span>
                        </div>
                        <div>
                            <strong>Residence: </strong> <span>{extractedResidence}</span>
                        </div>
                    </div>
                </div>

                {patientMedicalNotes && (
                    <>
                        {patientMedicalNotes.chief_complaint && (
                            <div>
                                <strong className="text-xl">Chief Complaint</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.chief_complaint}</Markdown>
                                </div>
                            </div>
                        )}

                        {patientMedicalNotes.history_of_present_illness && (
                            <div>
                                <strong className="text-xl">History of Presenting Complaint</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.history_of_present_illness}</Markdown>
                                </div>
                            </div>
                        )}

                        {patientMedicalNotes.review_of_systems && (
                            <div>
                                <strong className="text-xl">Review of Systems</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.review_of_systems}</Markdown>
                                </div>
                            </div>
                        )}

                        {patientMedicalNotes.social_history && (
                            <div>
                                <strong className="text-xl">Social History</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.social_history}</Markdown>
                                </div>
                            </div>
                        )}

                        {patientMedicalNotes.medication_history && (
                            <div>
                                <strong className="text-xl">Medication History and Allergies</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.medication_history}</Markdown>
                                </div>
                            </div>
                        )}

                        {patientMedicalNotes.past_medical_history && (
                            <div>
                                <strong className="text-xl">Past Medical History</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.past_medical_history}</Markdown>
                                </div>
                            </div>
                        )}

                        {patientMedicalNotes.family_history && (
                            <div>
                                <strong className="text-xl">Family History</strong>
                                <div>
                                    <Markdown>{patientMedicalNotes.family_history}</Markdown>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/*<div>*/}
                {/*    <strong className="">Chief Complaint: </strong>{" "}*/}
                {/*    <span>*/}
                {/*        {patientMedicalNotes?.chief_complaint?.presenting_complaints &&*/}
                {/*        Array.isArray(patientMedicalNotes?.chief_complaint?.presenting_complaints)*/}
                {/*            ? patientMedicalNotes?.chief_complaint?.presenting_complaints.join(", ")*/}
                {/*            : patientMedicalNotes?.chief_complaint?.presenting_complaints*/}
                {/*              ? patientMedicalNotes?.chief_complaint?.presenting_complaints*/}
                {/*              : "N/A"}*/}
                {/*    </span>*/}
                {/*</div>*/}

                {/*<div>*/}
                {/*    <strong>HPC:</strong>{" "}*/}
                {/*    <div>{patientMedicalNotes?.chief_complaint?.hpc?.summary || "Not Provided"}</div>*/}
                {/*</div>*/}

                {/*<div>*/}
                {/*    <p>*/}
                {/*        <strong>Previous Illnesses:</strong>{" "}*/}
                {/*        {patientMedicalNotes?.medical_history?.general?.previous_illnesses?.toString() || "None"}*/}
                {/*    </p>*/}
                {/*    <p>*/}
                {/*        <strong>Critical Conditions:</strong>{" "}*/}
                {/*        {Array.isArray(patientMedicalNotes?.medical_history?.medical?.critical_conditions) &&*/}
                {/*        patientMedicalNotes.medical_history?.medical.critical_conditions.length > 0*/}
                {/*            ? patientMedicalNotes.medical_history.medical.critical_conditions.join(", ")*/}
                {/*            : "None"}*/}
                {/*    </p>*/}
                {/*</div>*/}

                {/*<div>*/}
                {/*    <strong>Systemic Enquiry</strong>*/}
                {/*    <br />*/}
                {/*    <ul className="list-disc ml-4">*/}
                {/*        <li>*/}
                {/*            <strong>Appetite & Weight Changes:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.appetite_weight_changes || "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Gastrointestinal Symptoms:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.gastrointestinal_symptoms &&*/}
                {/*            patientMedicalNotes.systemic_enquiry.gastrointestinal_symptoms.length > 0*/}
                {/*                ? patientMedicalNotes.systemic_enquiry.gastrointestinal_symptoms.join(", ")*/}
                {/*                : "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Musculoskeletal Issues:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.musculoskeletal_issues || "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Neurological Symptoms:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.neurological_symptoms || "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Psychological Symptoms:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.psychological_symptoms || "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Respiratory Symptoms:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.respiratory_symptoms &&*/}
                {/*            patientMedicalNotes.systemic_enquiry.respiratory_symptoms.length > 0*/}
                {/*                ? patientMedicalNotes.systemic_enquiry.respiratory_symptoms.join(", ")*/}
                {/*                : "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Sexual Health:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.sexual_health || "None"}*/}
                {/*        </li>*/}
                {/*        <li>*/}
                {/*            <strong>Urinary Issues:</strong>{" "}*/}
                {/*            {patientMedicalNotes?.systemic_enquiry?.urinary_issues || "None"}*/}
                {/*        </li>*/}
                {/*    </ul>*/}
                {/*</div>*/}

                {/*<div>*/}
                {/*    <p>*/}
                {/*        <strong>Drug And Allergies:</strong>{" "}*/}
                {/*        {typeof patientMedicalNotes?.drug_and_allergy === "string"*/}
                {/*            ? patientMedicalNotes.drug_and_allergy*/}
                {/*            : "None"}*/}
                {/*    </p>*/}
                {/*</div>*/}

                {/*<div>*/}
                {/*    <p>*/}
                {/*        <strong>Occupation:</strong> {patientMedicalNotes?.social_history?.occupation || "N/A"}*/}
                {/*    </p>*/}
                {/*    <p>*/}
                {/*        <strong>Marital Status:</strong> {patientMedicalNotes?.social_history?.marital_status || "N/A"}*/}
                {/*    </p>*/}
                {/*</div>*/}

                {/*<div>*/}
                {/*    <p>*/}
                {/*        <strong>Family Members:</strong>*/}
                {/*    </p>*/}
                {/*    <ul className="list-disc ml-4">*/}
                {/*        {Array.isArray(patientMedicalNotes?.family_history) &&*/}
                {/*        patientMedicalNotes.family_history.length > 0 ? (*/}
                {/*            patientMedicalNotes.family_history.map((member, index) => <li key={index}>{member}</li>)*/}
                {/*        ) : (*/}
                {/*            <span>No family history recorded.</span>*/}
                {/*        )}*/}
                {/*    </ul>*/}
                {/*</div>*/}
            </div>
        </div>
    )
}

export default MedicalNotes

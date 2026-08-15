import {DoctorDashboardDiagnosis} from "@/utils/types";
import React, {useEffect, useState} from "react";
import {motion, Variants} from "framer-motion";
import {CgClose} from "react-icons/cg";
import {deleteDiagnosis, updateDiagnosis} from "@/services/dashboard/patient_history.service";

export const PatientHistoryModal = ({patientHistoryItem, closeModal, openDiagnosis}: {
    patientHistoryItem: DoctorDashboardDiagnosis,
    closeModal: () => void,
    openDiagnosis: () => void,
}) => {
    const [enableEditing, setEnableEditing] = useState(false)
    const [patientHistoryName, setPatientHistoryName] = useState(patientHistoryItem.name)

    const variants: Variants = {
        left: {
            x: '-100%',
            transition: {
                duration: 0.1,
                ease: 'linear',
            },
        },
        right: {
            x: '100%',
            transition: {
                duration: 0.1,
                ease: 'linear',
            },
        },
    }

    useEffect(() => {
        setPatientHistoryName(patientHistoryItem.name)
    }, [patientHistoryItem])

    return (
        <div
            className="z-20 fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800
                 bg-opacity-20 backdrop-blur-sm rounded">
            <div className="z-30 w-4/5 lg:w-3/5 max-h-[80vh] lg:h-max bg-white p-4 rounded-lg shadow-lg flex flex-col
                justify-between">
                <div className='flex justify-between items-center'>
                    <input
                        disabled={!enableEditing}
                        type="text"
                        value={patientHistoryName}
                        onChange={(e) => setPatientHistoryName(e.target.value)}
                        className={`w-5/6 py-1 sm:text-lg outline-none rounded px-2 
                            ${enableEditing ? 'italic bg-blue-50 font-light' : 'bg-white'}`}/>
                    {/*<h2 className="text-lg font-semibold mb-2 text-gray-800">{patientHistoryItem.name}</h2>*/}
                    <CgClose size={30} onClick={closeModal} className='hover:bg-gray-200 w-10 h-10 p-2 rounded-full'/>
                </div>
                <div
                    className={`flex items-center w-full mt-2 mb-2`}>
                    <motion.button
                        variants={variants}
                        animate={enableEditing ? 'right' : ''}
                        onClick={() => {
                            setEnableEditing(prevState => {
                                if (prevState) setPatientHistoryName(patientHistoryItem.name)
                                return !prevState
                            })
                        }}
                        className={`w-1/2 border text-xs sm:text-base py-1 sm:py-2 px-4 rounded 
                             ${enableEditing ? 'border-white text-blue-500' :
                            'border-blue-500 text-blue-500 '}`}>
                        {enableEditing ? 'Cancel' : 'Rename Diagnosis'}
                    </motion.button>
                    <motion.button
                        variants={variants}
                        animate={enableEditing ? 'left' : ''}
                        onClick={() => {
                            setEnableEditing(false)
                            updateDiagnosis(patientHistoryItem.id, {
                                name: patientHistoryName,
                            }).then((response) => {
                                if (response) {
                                    window.dispatchEvent(new Event('storage'))
                                }
                            })
                        }}
                        className={`w-1/2 border text-xs sm:text-base py-1 sm:py-2 px-4 rounded 
                             ${enableEditing ? 'border-blue-500 text-white bg-blue-500 opacity-100' :
                            'border-blue-500 text-blue-500 hidden opacity-0 '}`}>
                        Save
                    </motion.button>
                </div>
                <hr/>
                <div className='overflow-y-auto border-b border-b-gray-300'>
                    <div className='flex flex-col gap-4 mb-5 text-gray-700'>
                        <p><strong>Summary: </strong> {patientHistoryItem.summary}</p>
                        <hr/>
                        <p><strong>Primary Diagnosis: </strong>
                            <span
                                className='text-gray-800 font-medium'>
                                {patientHistoryItem.differential_diagnosis.condition} </span>-
                            {patientHistoryItem.differential_diagnosis.reasoning}
                        </p>
                    </div>

                </div>
                <div className='flex justify-between'>
                    <button
                        onClick={() => openDiagnosis()}
                        className={`mt-4 border border-blue-700 text-blue-700 hover:bg-blue-400 py-2 px-4 
                            rounded hover:text-white`}>
                        Open
                    </button>
                    <button
                        onClick={() => {
                            deleteDiagnosis(patientHistoryItem.id).then(() => {
                                window.dispatchEvent(new Event('storage'))
                                closeModal()
                            })
                        }}
                        className="mt-4 bg-red-600 text-white hover:bg-gray-400 py-2 px-4 rounded">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

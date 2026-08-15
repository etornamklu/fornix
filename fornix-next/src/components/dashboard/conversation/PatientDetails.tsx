import Button from "@/components/global/Button"
import Input from "@/components/ui/input"
import CustomSelect from "@/components/ui/selectInput"
import React, { useState } from "react"
import ConnectionList from "./ConnnectionList"
import { usePatientFormStore } from "../../../../store/patientFormStore"
import { useSelectedPatientStore } from "../../../../store/SelectedPatientStore"

import { motion } from "framer-motion"

const PatientDetails = ({ stepToNextPage }: { stepToNextPage: (e: number) => void }) => {
    const { setFormData } = usePatientFormStore()
    const clearSelectedPatient = useSelectedPatientStore(state => state.clearSelectedPatient)

    const [patientInfo, setPatientInfo] = useState({
        name: "",
        gender: "",
        age: "",
        location: ""
    })
    const [openConnectionListModal, setOpenConnectionListModal] = useState(false)

    const closeConnectionListModal = () => {
        setOpenConnectionListModal(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === "age" && (value as any) <= 0) {
            setPatientInfo(prev => ({ ...prev, [name]: "" }))
        } else {
            setPatientInfo(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target
        if (value !== "Select gender") {
            setPatientInfo(prev => ({ ...prev, [name]: value }))
        } else if (value === "Select gender") {
            setPatientInfo(prev => ({ ...prev, [name]: "" }))
        }
    }

    // anmimating component on mount
    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    //disable button if any field is empty
    const isButtonDisabled = () => {
        return Object.values(patientInfo).some(value => value === "")
    }

    //shared styles
    const labelStyles = "font-[600] text-[14px] text-slate-800"
    const inputStyles = "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none focus:shadow-lg"

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeAnimation}
            transition={{ duration: 0.1, ease: "easeIn" }}
            className="w-full pt-5 lg:pt-10 flex flex-col h-full justify-start overflow-y-auto xl:justify-center items-center">
            <div>
                <div
                    className="text-center font-semibold 2xl:text-6xl
                        lg:text-3xl text-4xl  flex flex-col">
                    <h1>Ambient Conversation</h1>
                    <div className="w-full flex place-items-center gap-3 justify-center">
                        <h1>
                            <span className="text-[#0476D9] italic">Capture</span>
                        </h1>

                        {/* outer most circle */}
                        <div className="w-6 h-6 border-2 border-red-200 rounded-full flex place-items-center justify-center sm:w-10 sm:h-10">
                            {/* middle circle */}
                            <div className="w-4 h-4 border-l-2 border-t-2 border-r-2 border-b-2 border-red-300 rounded-full flex place-items-center justify-center sm:w-8 sm:h-8 sm:border-l-4 sm:border-r-4 sm:border-t-4 sm:border-b-4">
                                {/* inner most circle */}
                                <div className="w-2 h-2 animate-ping duration-1000 bg-red-400 rounded-full sm:w-4 sm:h-4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <h6 className="text-[#334155] text-center mt-3">
                    <p>Capture and transcribe patient-clinician conversations</p>
                    <p>into structured medical histories for</p>
                    <p>seamless documentation.</p>
                </h6>
            </div>

            {/* patient info form */}
            <form className="w-full max-w-3xl mt-12 lg:mt-24 flex flex-col gap-4 pb-12">
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-4">
                    <div className="w-full flex flex-col gap-1">
                        <label htmlFor="patient-name" className={labelStyles}>
                            What&apos;s your patient&apos;s name
                        </label>
                        <Input
                            name={"name"}
                            placeholder={"Eg. Grace Ashley"}
                            required={true}
                            value={patientInfo.name}
                            onChange={e => handleInputChange(e)}
                            sx={inputStyles}
                        />
                    </div>

                    <div className="w-full flex flex-col gap-1">
                        <label htmlFor="patient-gender" className={labelStyles}>
                            What&apos;s your patient&apos;s gender
                        </label>

                        <CustomSelect
                            defaultValue="select gender"
                            sx="w-full"
                            options={[
                                { label: "Select gender", value: "" },
                                { label: "Male", value: "male" },
                                { label: "Female", value: "female" }
                            ]}
                            onSelect={(selectedValue: string) => {
                                handleSelection({
                                    target: { name: "gender", value: selectedValue }
                                } as React.ChangeEvent<HTMLSelectElement>)
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="patient-age" className={labelStyles}>
                            What&apos;s your patient&apos;s age
                        </label>
                        <Input
                            type="number"
                            name={"age"}
                            placeholder={"Eg. 22"}
                            required={true}
                            value={patientInfo.age}
                            onChange={e => handleInputChange(e)}
                            sx={inputStyles}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="patient-name" className={labelStyles}>
                            What&apos;s your patient&apos;s location
                        </label>
                        <Input
                            name={"location"}
                            placeholder={"Eg. Kumasi"}
                            required={true}
                            value={patientInfo.location}
                            onChange={e => handleInputChange(e)}
                            sx={inputStyles}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="w-full">
                        <Button
                            variant="primary"
                            disabled={isButtonDisabled()}
                            className="w-full h-10 text-[16px] disabled:bg-blue-300"
                            onClick={() => {
                                setFormData(patientInfo.name, patientInfo.age, patientInfo.gender, patientInfo.location)
                                clearSelectedPatient()
                                stepToNextPage(1)
                            }}>
                            <h6>Continue</h6>
                        </Button>
                    </div>

                    <div className="w-full text-center">or</div>

                    <div className="w-full flex justify-center">
                        <Button
                            variant="outline"
                            className="w-full max-w-[286px] h-10 text-[16px] text-gray-500  bg-transparent hover:bg-slate-300 transition-all .1s border border-[#D0D5DD]"
                            onClick={() => setOpenConnectionListModal(true)}>
                            <h6>Select patient from connection list</h6>
                        </Button>
                    </div>
                </div>
            </form>

            <ConnectionList
                isModalOn={openConnectionListModal}
                closeModal={closeConnectionListModal}
                stepToNextPage={stepToNextPage}
            />
        </motion.div>
    )
}

export default PatientDetails

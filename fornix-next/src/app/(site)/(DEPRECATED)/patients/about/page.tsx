"use client"
import React, { useEffect, useRef } from "react"
import { useState } from "react"

import { IEmergencyContact, LogoVariants, PatientStaticData } from "@/utils/types"

import { LogoAsset } from "@/components/assets/LogoAsset"
import Step1 from "@/components/patients/about/Step1"
import Step2 from "@/components/patients/about/Step2"
import Step3 from "@/components/patients/about/Step3"
import Step4 from "@/components/patients/about/Step4"
import Step5 from "@/components/patients/about/Step5"

import { BsTriangleFill } from "react-icons/bs"

const Page = () => {
    const [step, setStep] = useState(2)
    const [userData, setUserData] = useState<PatientStaticData>({
        fullname: "",
        dob: "",
        gender: "",
        maritalStatus: "",
        occupation: "",
        occupationDesc: "",
        address: "",
        phone: "",
        emergencyContacts: [],
        surgicalHistory: "",
        allergies: "",
        medications: "",
        familyHistory: "",
        lifeStyleHabits: "",
        dietaryHabits: "",
        exerciseRoutine: 1,
        psychosocialHistory: ""
    })

    const containerRef = useRef<any>(null)

    const handleDataChange = (key: string, value: string | number | IEmergencyContact[]) => {
        setUserData(prev => ({ ...prev, [key]: value }))
    }

    useEffect(() => {
        if (!containerRef?.current) return
        containerRef?.current?.scrollTo(0, 0)
    }, [step, containerRef])

    const pages = [
        <Step1 setStep={setStep} {...userData} handleDataChange={handleDataChange} key={0} />,
        <Step2 setStep={setStep} handleDataChange={handleDataChange} {...userData} key={1} />,
        <Step3 setStep={setStep} handleDataChange={handleDataChange} {...userData} key={1} />,
        <Step4 setStep={setStep} handleDataChange={handleDataChange} {...userData} key={1} />,
        <Step5 setStep={setStep} handleDataChange={handleDataChange} {...userData} key={1} />
    ]
    return (
        <div className="w-full font-product-sans  h-auto flex flex-col items-center justify-center gap-3 p-5 pt-0">
            <div className="flex w-full justify-center items-center py-5 sticky top-0 z-[3] bg-[#F7F7F7] border-b-[1px] gap-3">
                <LogoAsset size={40} title={true} variant={LogoVariants.dark} />

                <span className="py-[3px] block text-white text-sm px-2 rounded-full uppercase bg-[#F9921B]">Beta</span>
            </div>
            <main
                className="relative max-w-5xl h-[85vh] overflow-y-auto  bg-white w-full mx-auto   border-[1px] md:h-full rounded-[12px]"
                ref={containerRef}>
                <div className=" bg-white z-2 justify-between items-center py-4 min-h-12">
                    <div className="w-full px-3 mx-auto md:w-3/4  flex items-center md:items-stretch justify-between gap-5">
                        {step > 0 && (
                            <>
                                <button
                                    className="relative md:hidden flex items-center justify-center gap-[5px] h-8 w-10 rounded-full border-[1px]"
                                    onClick={() => setStep(prev => --prev)}
                                    disabled={step === 0}>
                                    <BsTriangleFill className="rotate-[-90deg] mr-[4px] text-sm text-gray-400" />
                                </button>
                                <button
                                    className=" hidden w-auto bg-gray-100 md:flex items-center justify-between gap-[5px]  py-2 px-6 rounded-full border-[1px]"
                                    onClick={() => setStep(prev => --prev)}>
                                    <span className="">
                                        <BsTriangleFill className="rotate-[-90deg] text-sm text-gray-400" />
                                    </span>
                                    go back
                                </button>
                            </>
                        )}

                        <div className="w-[calc(80%-50px)] flex flex-col items-start justify-center  md:w-[calc(70%-50px)]">
                            <div className="relative w-full bg-gray-100 h-3 rounded-full">
                                <div
                                    className={
                                        "absolute blue-gradient h-full rounded-full top-0 left-0 transition-all duration-100"
                                    }
                                    style={{ width: `${((step + 1) / 5) * 100}%` }}></div>
                                {step === 1 && (
                                    <p className="mt-5 hidden md:block text-[12px] uppercase font-bold text-gray-700">
                                        You making progress
                                    </p>
                                )}
                            </div>
                        </div>
                        <button className="relative   py-2 px-6 rounded-full border-[1px]">Save</button>
                    </div>
                </div>
                <div className=" w-full mx-auto bg-white p-2 pt-2 md:p-3">
                    <div className="w-full  md:w-1/2 md:px-6 md:mt-0 md:min-h-screen mx-auto">
                        <div className="">
                            <div className="my-6">{pages[step]}</div>
                        </div>
                    </div>

                    {/* <button className="absolute hidden md:block right-6 top-6  py-2 px-6 rounded-full border-[1px]">Save & Exit</button> */}
                </div>
            </main>
        </div>
    )
}

export default Page

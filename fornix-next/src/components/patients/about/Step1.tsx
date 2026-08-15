import React from "react";
import Image from "next/image";

import MaleImage from "@/assets/male.png";
import FemaleImage from "@/assets/female.png";
import {IDataStep} from "@/utils/types";

const Step1 = ({fullname, gender, dob, setStep, handleDataChange}: IDataStep) => {
    return (
        <>
            <h3 className="font-bold text-2xl">Let us complete your profile</h3>
            <form className="w-full mt-4 md:mt-7 md:px-6">
                <div className="w-full">
                    <label htmlFor="fullname" className="block mb-[3px] font-semibold text-md">
                        What&apos;s your fullname?
                    </label>
                    <input
                        type="text"
                        id="fullname"
                        value={fullname}
                        onChange={(e) => handleDataChange("fullname", e.target.value)}
                        className={`w-full h-auto bg-[#F7F9FC]  py-2 px-3 border-[1px] rounded-[10px] ${!fullname && "opacity-50 focus:opacity-100"}`}
                        placeholder="James Appiah"
                    />
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="dob" className="block mb-[3px] font-semibold text-md">
                        Your date of birth
                    </label>
                    <input
                        type="date"
                        id="dob"
                        value={dob}
                        onChange={(e) => handleDataChange("dob", e.target.value)}
                        className={`w-full h-auto bg-[#F7F9FC]  py-2 px-3 border-[1px] rounded-[10px] ${!dob && "opacity-50 focus:opacity-100"}`}
                        placeholder="James Appiah"
                    />
                </div>

                <div className="w-full mt-4">
                    <label htmlFor="fullname" className="block mb-[3px] font-semibold text-md">
                        Can we know your gender?
                    </label>

                    {
                        <div
                            className={`w-full flex mt-3 items-center justify-center gap-4 ${!gender && "opacity-50 hover:opacity-100"} `}>
                            <button
                                type="button"
                                className={`w-1/2 md:w-1/3 ${
                                    gender === "male" ? "border-[#1A6AFF] bg-[#EEF5FC]" : "hover:bg-[#EEF5FC] bg-[#E2E8F0]/20"
                                } border-[1px] rounded-[5px] p-4 flex flex-col items-center justify-center`}
                                onClick={() => handleDataChange("gender", "male")}>
								<span className="block w-16 relative h-16">
									<Image src={MaleImage} fill alt="Male Image Icon"/>
								</span>
                                <p className="mt-2 text-sm font-semibold">Male</p>
                            </button>
                            <button
                                type="button"
                                className={`w-1/2 md:w-1/3 ${
                                    gender === "female" ? "border-[#1A6AFF] bg-[#EEF5FC]" : "hover:bg-[#EEF5FC] bg-[#E2E8F0]/20"
                                } border-[1px] rounded-[5px] p-4 flex flex-col items-center justify-center`}
                                onClick={() => handleDataChange("gender", "female")}>
								<span className="block w-16 relative h-16">
									<Image src={FemaleImage} fill alt="Female Image Icon"/>
								</span>
                                <p className="mt-2 text-sm font-semibold">Female</p>
                            </button>
                        </div>
                    }

                    <button className="blue-gradient block w-full rounded-full text-white py-4 mt-6 md:mt-12"
                            onClick={() => setStep((prev) => ++prev)}>
                        Continue
                    </button>
                </div>
            </form>
        </>
    );
};

export default Step1;

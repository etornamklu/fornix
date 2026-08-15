import React, {useState} from "react";
import Select from "react-select";

import {IDataStep} from "@/utils/types";
import marriageStatus from "@/data/marriageStatus.json";
import occupations from "@/data/occupation.json";

const Step2 = ({setStep, occupation, maritalStatus, occupationDesc, handleDataChange}: IDataStep) => {
    return (
        <div className="w-full h-auto md:pb-12">
            <h3 className="font-bold text-2xl">We making progress</h3>
            <form className="w-full mt-7 md:px-6">
                <div className="w-full">
                    <label htmlFor="fullname" className="block mb-[3px] font-semibold text-md">
                        Your marital status
                    </label>
                    <Select
                        className={`basic-single ${maritalStatus ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                        classNamePrefix="select"
                        placeholder="Select"
                        options={marriageStatus}
                        onChange={(selected) => handleDataChange("maritalStatus", selected?.value as string)}
                        value={marriageStatus?.find((e) => e.value == maritalStatus)}
                        name="color"
                    />
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="dob" className="block mb-[3px] font-semibold text-md">
                        What is your current occupation or profession?
                    </label>
                    <Select
                        className={`basic-single ${occupation ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                        classNamePrefix="select"
                        placeholder="Select"
                        options={occupations}
                        onChange={(selected) => handleDataChange("occupation", selected?.value as string)}
                        value={occupations?.find((e) => e.value == occupation)}
                        name="color"
                    />
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="details" className="block mb-[3px] font-semibold text-md">
                        Can you also add details about it?
                    </label>

                    <textarea
                        name=""
                        value={occupationDesc}
                        onChange={(e) => handleDataChange("occupationDesc", e.target.value)}
                        id="details"
                        className="w-full h-24 md:h-36 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Can you describe the nature of your work, including any occupational exposures or hazards?"></textarea>

                    <button className="blue-gradient block  w-full rounded-full text-white py-4 mt-6 md:mt-12"
                            onClick={() => setStep((prev) => ++prev)}>
                        Continue
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Step2;

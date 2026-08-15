import React from "react";
import Image from "next/image";

import {IDataStep} from "@/utils/types";

const Step4 = ({surgicalHistory, allergies, medications, setStep, handleDataChange, familyHistory}: IDataStep) => {
    return (
        <>
            <h3 className="font-bold text-2xl">It&apos;s time for your medical history</h3>
            <form className="w-full mt-7 md:px-6">
                <div className="w-full">
                    <label htmlFor="surgicalHistory" className="block mb-[3px] font-semibold text-md">
                        Your surgical history
                    </label>
                    <textarea
                        value={surgicalHistory}
                        onChange={(e) => handleDataChange("surgicalHistory", e.target.value)}
                        id="surgicalHistory"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Could you please share details?"></textarea>
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="allergies" className="block mb-[3px] font-semibold text-md">
                        Do you have any allergies
                    </label>
                    <textarea
                        value={allergies}
                        onChange={(e) => handleDataChange("allergies", e.target.value)}
                        id="allergies"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Any specific allergies?"></textarea>
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="medications" className="block mb-[3px] font-semibold text-md">
                        Medications (Current and Past)
                    </label>
                    <textarea
                        value={medications}
                        onChange={(e) => handleDataChange("medications", e.target.value)}
                        id="medications"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Can you provide details?"></textarea>
                </div>
                <div className="w-full mt-6">
                    <label htmlFor="familyHistory" className="block mb-[3px] font-semibold text-md">
                        Family Medical History:
                    </label>
                    <textarea
                        value={familyHistory}
                        onChange={(e) => handleDataChange("familyHistory", e.target.value)}
                        id="familyHistory"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Does any of them have Diabetes, Hypertension, Asthma, or Sickle Cell Disease?"></textarea>
                </div>

                <button className="blue-gradient block  w-full rounded-full text-white py-4 mt-6 md:mt-12"
                        onClick={() => setStep((prev) => ++prev)}>
                    Continue
                </button>
            </form>
        </>
    );
};

export default Step4;

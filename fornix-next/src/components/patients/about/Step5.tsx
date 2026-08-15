import React, {FormEvent} from "react";

import {IDataStep} from "@/utils/types";

import Scale from "./Scale";

const Step5 = (props: IDataStep) => {
    const {lifeStyleHabits, dietaryHabits, exerciseRoutine, setStep, handleDataChange, psychosocialHistory} = props;
    const completeForm = (e: FormEvent) => {
        e.preventDefault();
        const {handleDataChange, ...rest} = props;
        console.log(rest);
    };
    return (
        <>
            <h3 className="font-bold text-2xl">Your habits</h3>
            <form className="w-full mt-7 md:px-6">
                <div className="w-full">
                    <label htmlFor="lifeStyleHabits" className="block mb-[3px] font-semibold text-md">
                        Your lifestyle habits
                    </label>
                    <textarea
                        value={lifeStyleHabits}
                        onChange={(e) => handleDataChange("lifeStyleHabits", e.target.value)}
                        id="lifeStyleHabits"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Could you please share details?"></textarea>
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="dietaryHabits" className="block mb-[3px] font-semibold text-md">
                        Your dietary habits
                    </label>
                    <textarea
                        value={dietaryHabits}
                        onChange={(e) => handleDataChange("dietaryHabits", e.target.value)}
                        id="dietaryHabits"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Any specific habits?"></textarea>
                </div>

                <div className="w-full mt-6">
                    <label htmlFor="exerciseRoutine" className="block mb-[3px] font-semibold text-md">
                        On a scale 1 - 5, how often do you engage in physical activity or exercise
                    </label>

                    <Scale value={exerciseRoutine}
                           setValue={(value: number) => handleDataChange("exerciseRoutine", value)}/>
                </div>
                <div className="w-full mt-6">
                    <label htmlFor="psychosocialHistory" className="block mb-[3px] font-semibold text-md">
                        Your psychosocial history
                    </label>
                    <textarea
                        value={psychosocialHistory}
                        onChange={(e) => handleDataChange("psychosocialHistory", e.target.value)}
                        id="psychosocialHistory"
                        className="w-full h-24 resize-none border-[1px] rounded-[8px] p-2 text-sm"
                        placeholder="Let us have it"></textarea>
                </div>

                <button className="blue-gradient block  w-full rounded-full text-white py-4 mt-6 md:mt-12"
                        onClick={completeForm}>
                    Complete
                </button>
            </form>
        </>
    );
};

export default Step5;

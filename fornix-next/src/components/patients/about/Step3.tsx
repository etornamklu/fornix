import React from "react";
import Image from "next/image";

import {IEmergencyContact, IDataStep, INewEmergencyContact} from "@/utils/types";

import GhanaLogoImage from "@/assets/ghana-flag.png";

import NewEmergencyContact from "../emergency/NewEmergencyContact";
import EmergencyContact from "../emergency/EmergencyContact";

const Step3 = ({address, phone, setStep, handleDataChange, emergencyContacts}: IDataStep) => {
    const addNewEmergencyContact = ({name, number, relationship}: IEmergencyContact) => {
        const contacts = [{name, number, relationship}, ...emergencyContacts];
        handleDataChange("emergencyContacts", contacts);
    };

    const deleteEmergencyContact = (index: number) => {
        handleDataChange(
            "emergencyContacts",
            emergencyContacts.filter((p, i) => i != index)
        );
    };

    return (
        <>
            <h3 className="font-bold text-2xl">It&apos;s time for your contact details</h3>
            <form className="w-full mt-7 md:px-6">
                <div className="w-full">
                    <label htmlFor="address" className="block mb-[3px] font-semibold text-md">
                        We need your address
                    </label>
                    <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => handleDataChange("address", e.target.value)}
                        className={`w-full h-auto bg-[#F7F9FC]  py-2 px-3 border-[1px] rounded-[10px] ${!address && "opacity-50 focus:opacity-100"}`}
                        placeholder="Kasoa Akweley"
                    />
                </div>

                <div className="w-full mt-8">
                    <label htmlFor="phone" className="block mb-3 font-semibold text-md">
                        Add a reliable phone number to reach out to you
                    </label>

                    <div className="w-full flex items-stretch justify-between">
                        <div
                            className="w-[120px] rounded-tl-[6px] rounded-bl-[6px] border-[1px] flex items-center justify-center gap-2">
							<span className="block h-6 w-6 relative">
								<Image src={GhanaLogoImage} alt="" fill/>
							</span>
                            <p>+233</p>
                        </div>
                        <input
                            type="text"
                            id="phone"
                            value={phone}
                            onChange={(e) => handleDataChange("phone", e.target.value)}
                            className={`w-full h-auto bg-white rounded-tr-[6px] rounded-br-[6px] border-border py-2 px-3 border-[1px]  ${!phone && "opacity-50 focus:opacity-100"}`}
                            placeholder="5555538672"
                        />
                    </div>
                </div>

                <div className="w-full mt-8">
                    <p className="mb-[3px] font-semibold text-md">Your emergency contact details</p>

                    <div className="w-full">
                        <div className="w-full mt-6">
                            {emergencyContacts?.map((contact, index) => (
                                <EmergencyContact key={index} {...contact} sx="!bg-transparent"
                                                  delContact={() => deleteEmergencyContact(index)}/>
                            ))}
                        </div>
                        <NewEmergencyContact addContact={({
                                                              name,
                                                              number,
                                                              relationship
                                                          }: IEmergencyContact) => addNewEmergencyContact({
                            name,
                            number,
                            relationship
                        })}/>
                        {/* Add Emergency contacts */}
                    </div>
                </div>
                <button className="blue-gradient block  w-full rounded-full text-white py-4 mt-6 md:mt-12"
                        onClick={() => setStep((prev) => ++prev)}>
                    Continue
                </button>
            </form>
        </>
    );
};

export default Step3;

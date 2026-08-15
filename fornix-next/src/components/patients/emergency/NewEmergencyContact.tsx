import {IEmergencyContact} from "@/utils/types";
import React, {useState} from "react";
import {LuPlus} from "react-icons/lu";

const initial = {
    name: "",
    number: "",
    relationship: "",
};

const NewEmergencyContact = ({sx = "", addContact}: {
    sx?: string;
    addContact: ({name, relationship, number}: IEmergencyContact) => void
}) => {
    const [showForm, setShowForm] = useState(false);

    const [contactData, setContactData] = useState(initial);

    const saveContact = () => {
        // Save emergency contact

        // Add to state
        const {name, number, relationship} = contactData;
        addContact({name, number, relationship});
        // Clear form
        setContactData(initial);
        // Remove form
        setShowForm(false);
    };
    return (
        <div>
            {/* New Contact */}
            {!showForm && (
                <button
                    className={`flex items-center w-full text-[#8C96A5] bg-[#F7F9FC] my-3 border-dashed border-[2px] rounded-[8px] py-2 justify-center gap-2`}
                    type="button"
                    onClick={() => setShowForm(true)}>
                    Add new contact
                    <span className="w-4 flex items-center justify-center h-4">
						<LuPlus/>
					</span>
                </button>
            )}

            {showForm && (
                <>
                    <div className={`${sx} p-4 rounded-[12px] mb-4 bg-[#FAFAFA] border-[1px]`}>
                        <h3 className="font-bold mb-3">Add A New Emergency Contact</h3>
                        <div className="flex flex-col md:flex-row items-stretch justify-between gap-3">
                            <div className="w-1/2">
                                <label htmlFor="name" className="block mb-[4px] font-semibold text-md">
                                    Contact&apos;s name
                                </label>

                                <input
                                    type="text"
                                    id="name"
                                    value={contactData?.name}
                                    onChange={(e) => setContactData((prev) => ({...prev, name: e.target.value}))}
                                    className={`w-full h-auto rounded-[5px] border-border py-2 px-3 border-[1px]  ${!contactData.name && "opacity-50 focus:opacity-100"}`}
                                    placeholder="eg. Michael Mensah"
                                />
                            </div>

                            <div className="w-1/2">
                                <label htmlFor="number" className="block mb-[4px] font-semibold text-md">
                                    Number
                                </label>
                                <div className="w-full flex items-stretch justify-between">
                                    <div
                                        className="w-[100px] border-[1px] rounded-bl-[5px] rounded-tl-[5px] flex items-center justify-center gap-2">
                                        <p>+233</p>
                                    </div>
                                    <input
                                        type="text"
                                        id="number"
                                        value={contactData.number}
                                        onChange={(e) => setContactData((prev) => ({...prev, number: e.target.value}))}
                                        className={`w-full h-auto bg-transparent focus:outline-0 rounded-br-[5px] rounded-tr-[5px] border-border py-2 px-3 border-[1px]  ${
                                            !contactData.number && "opacity-50 focus:opacity-100"
                                        }`}
                                        placeholder="5555538672"
                                    />
                                </div>
                            </div>
                            {/* <div></div> */}
                        </div>

                        <div className="w-full mt-4">
                            <label htmlFor="relationship" className="block mb-[4px] font-semibold text-md">
                                What is their relationship to you
                            </label>

                            <input
                                type="text"
                                id="relationship"
                                value={contactData.relationship}
                                onChange={(e) => setContactData((prev) => ({...prev, relationship: e.target.value}))}
                                className={`w-full h-auto bg-transparent rounded-[5px] border-border py-2 px-3 border-[1px]  ${!contactData.relationship && "opacity-50 focus:opacity-100"}`}
                                placeholder="eg: Father"
                            />
                        </div>

                        <button
                            className="mt-4 bg-[red] rounded-[10px] text-white flex items-center justify-center w-full blue-gradient py-2"
                            onClick={saveContact}>
                            Save Contact
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default NewEmergencyContact;

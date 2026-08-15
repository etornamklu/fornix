import React from "react";
import Image from "next/image";

import {IEmergencyContact} from "@/utils/types";

interface IEmergencyContactCard extends IEmergencyContact {
    sx?: string;
    delContact: () => void;
}

import WasteImage from "@/assets/waste.png";
import ContactImage from "@/assets/contact.png";

const EmergencyContact = ({name, number, sx = "", delContact}: IEmergencyContactCard) => {
    const deleteContact = () => {
        // Delete contact
        // Remove from state
        delContact();
    };
    return (
        <div
            className={`${sx} p-2 py-4 flex items-center justify-between rounded-[12px] bg-[#FAFAFA] mb-4  border-[1px]`}>
            <div className="flex items-start justify-start px-2 gap-2">
                <div className="w-10 h-10 rounded-full bg-[green] relative">
                    <Image src={ContactImage} fill alt="Placeholder"/>
                </div>
                <div>
                    <p>{name}</p>
                    <p className="text-[#8C96A5] -mt-[3px] text-[12px]">
                        +233 {" " + number.substring(0, 3)} {" " + number.substring(3, 6)} {" " + number.substring(6)}
                    </p>
                </div>
            </div>
            <button className="w-8 h-8 bg-[#FEF2F2] rounded-[5px] flex items-center justify-center"
                    onClick={deleteContact}>
				<span className="w-4 h-4 relative">
					<Image src={WasteImage} alt="Delete" fill/>
				</span>
            </button>
        </div>
    );
};

export default EmergencyContact;

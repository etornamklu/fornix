import React, {useState} from "react";
import Image from "next/image";

import Logo from "../../../public/images/logo-primary.png";

import {PiUser} from "react-icons/pi";
import {MdOutlineHelp} from "react-icons/md";
import {RiMenu3Line} from "react-icons/ri";
import {IoIosClose} from "react-icons/io";

interface ILandingHeaderProps {
    setShowConnections?: React.Dispatch<React.SetStateAction<boolean>>;
    showFornix?: boolean;
    setShowPhoneMenu: React.Dispatch<React.SetStateAction<boolean>>;
    goHome: () => void;
    showPhoneMenu: boolean;
    showDeskView?: boolean;
}

const LandingHeader = ({
                           setShowConnections,
                           showFornix = true,
                           setShowPhoneMenu,
                           showPhoneMenu,
                           goHome,
                           showDeskView
                       }: ILandingHeaderProps) => {
    const [role] = useState("doctor");
    return (
        <header
            className={`w-full  md:shadow-none md:bg-transparent px-2 md:px-0 shadow-md md:border-[0] border-[1px] rounded-[10px] py-2 flex ${
                !showDeskView ? "md:hidden" : ""
            } items-center justify-between`}>
            <button className="md:hidden h-8 w-8 relative flex items-center justify-center" onClick={() => goHome()}>
                <Image src={Logo} alt="Logo" fill/>
            </button>

            {showFornix && (
                <div className="flex gap-2 items-center font-bold text-[#15803D] bg-[#F0FDF4] px-4 py-2 rounded-full">
                    <span className="w-2 h-2 block rounded-full bg-[#15803D]"></span>
                    Fornix is online
                </div>
            )}

            {
                <div className="hidden  md:flex items-center justify-start gap-3">
                    <button
                        className="md:flex gap-[5px] font-bold px-3 bg-[#E2E8F0] rounded-[10px] py-2 text-gray-600 items-center"
                        onClick={() => setShowConnections && setShowConnections(true)}>
						<span className="w-6 h-6 flex items-center justify-center">
							<PiUser/>
						</span>
                        <p>Connections</p>
                    </button>
                    <div
                        className="hidden md:flex gap-[5px] font-bold px-3 rounded-[10px] py-2 text-black items-center">
						<span className="w-6 h-6 flex items-center justify-center">
							<MdOutlineHelp className="text-[#D9D9D9] text-2xl"/>
						</span>
                        <p>How it works</p>
                    </div>
                </div>
            }

            <button className="md:hidden h-8 w-8 flex items-center justify-center"
                    onClick={() => setShowPhoneMenu((prev) => !prev)}>
                {showPhoneMenu ? <IoIosClose className="text-5xl"/> : <RiMenu3Line className="text-2xl"/>}
            </button>
        </header>
    );
};

export default LandingHeader;

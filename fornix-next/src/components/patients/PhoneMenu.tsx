import React, {useState} from "react";


import {FaCirclePlus} from "react-icons/fa6";
import {HiOutlineDotsVertical} from "react-icons/hi";
import {authDefault} from "@/utils/types";
import RemainingCredits from "@/components/dashboard/RemainingCredits";

const PhoneMenu = ({showSettings}: { showSettings?: () => void }) => {
    const [auth, setAuth] = useState(authDefault);
    const diagnosisHistory = ["New Diagnosis", "Diagnosis 2", "Diagnosis 1"];
    return (
        <aside
            className="w-full h-[calc(100%-40px)] right-0 mx-auto min-h-[40vh] bg-[#FAFAFA] fixed top-[9vh] left-0 z-[2] p-4">
            <div className="w-full h-auto bg-white shadow-md rounded-[12px] p-4">
                <div className="flex flex-col w-full">
                    <div className="w-full mt-0 2xl:mt-12 flex justify-between items-center">
                        <span className="uppercase text-sm 2xl:text-lg text-gray-500">Diagnosis</span>
                        <div className={"cursor-pointer"}>
                            <FaCirclePlus size={30}/>
                        </div>
                    </div>

                    <div className="mt-4 mb-6 w-full  h-[35vh] overflow-y-auto text-sm">
                        {diagnosisHistory.map((diagnosis, index) => (
                            <button
                                key={index}
                                className={`flex p-2 w-full justify-between mb-2  items-center ${
                                    index == 0 ? "bg-[#F5F5F5] font-semibold" : ""
                                } text-gray-600 p-1 2xl:p-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none cursor-pointer`}>
                                <p className="">{diagnosis}</p>
                                <span
                                    className="flex text-gray-400 justify-center items-center hover:text-black hover:bg-gray-200  rounded-full">
									<HiOutlineDotsVertical size={25}/>
								</span>
                            </button>
                        ))}
                    </div>

                    {/* Upgrade */}

                    <RemainingCredits credits={auth.credits} setShowCreditPurchaseOverlay={function (b:boolean){} }/>

                    {/* Author */}
                    <div className="w-full mb-2 flex mt-6 justify-between items-center">
                        <div className="flex gap-3 items-center">
                            <img src={"https://picsum.photos/2800/4000"} alt={`profile img`}
                                 className="w-10 h-10 2xl:w-14 2xl:h-14 rounded-full"/>

                            <div className="w-24 2xl:w-32 flex flex-col justify-between">
                                <span
                                    className="text-sm  w-full overflow-hidden mb-[5px] text-nowrap text-ellipsis">{auth.name}</span>
                                <div className="w-16 flex justify-center items-center rounded-full bg-orange-100 p-1">
                                    <span className="flex items-center text-xs text-orange-800">{"Patient"}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="flex justify-center items-center text-gray-400 hover:text-black hover:bg-gray-200 p-2 rounded-full cursor-pointer"
                            onClick={() => showSettings && showSettings()}>
                            <HiOutlineDotsVertical size={25}/>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default PhoneMenu;

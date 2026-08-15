import React from "react";
import {LogoAsset} from "@/components/assets/LogoAsset";
import {LogoVariants} from "@/utils/types";
import {FaCirclePlus} from "react-icons/fa6";
import {HiOutlineDotsVertical} from "react-icons/hi";

const SideBar = () => {
    const patientHistoryList = ["New Patient", "Grace Amafo", "Prince Oboobi"];

    return (
        <div className="w-full lg:w-64 h-full pt-4 px-4 lg:flex flex-col items-center bg-gray-50 rounded-xl hidden">
            <div>
                <LogoAsset size={50} title={true} variant={LogoVariants.primary}/>
            </div>

            <div className="flex flex-col w-full h-full justify-between items-center">
                <div className="flex flex-col w-full">
                    <div className="w-full mt-12 flex justify-between items-center">
            <span className="uppercase text-lg text-gray-500">
              Patient History
            </span>
                        <FaCirclePlus size={30}/>
                    </div>

                    <div className="mt-4">
                        {patientHistoryList.map((patient, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-center text-gray-600 py-3 px-3 rounded-lg hover:font-semibold hover:bg-gray-100 select-none cursor-pointer"
                            >
                                {patient}
                                <div
                                    className="flex text-gray-400 justify-center items-center hover:text-black hover:bg-gray-200 p-2
                            rounded-full"
                                >
                                    <HiOutlineDotsVertical size={25}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full mb-4 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                        <img
                            src={"https://picsum.photos/2800/4000"}
                            alt={`profile img`}
                            className="w-14 h-14 rounded-full"
                        />

                        <div className="flex flex-col justify-between">
                            <span className="text-sm">Michael Mensah</span>
                            <div className="w-16 flex justify-center items-center rounded-full bg-orange-100 p-1">
                <span className="flex items-center text-xs text-orange-800">
                  Doctor
                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex justify-center items-center text-gray-400 hover:text-black hover:bg-gray-200
                    p-2 rounded-full cursor-pointer"
                    >
                        <HiOutlineDotsVertical size={25}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SideBar;

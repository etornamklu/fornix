import React, {useMemo} from "react";
import {IPlan} from "./Subscription";

import {BsThreeDotsVertical} from "react-icons/bs";

const BillingRow = ({no, date, status, amount, plan}: IPlan) => {
    const statusStyles = useMemo(() => {
        return {
            color: status === "processing" ? "#B54708" : status == "success" ? "#027A48" : "#B42318",
            backgroundColor: status === "processing" ? "#FFFAEB" : status == "success" ? "#ECFDF3" : "#FEF3F2",
        };
    }, [status]);
    return (
        <div
            className="w-full flex border-[1px] rounded-[14px] items-center justify-between mt-2 md:gap-3 p-4 px-2 border-border">
            <div className="w-[15%] text-sm flex items-center gap-3 justify-start">
                <span className="w-4 block h-4 rounded-[5px] border-[1px]"></span>
                {no < 10 ? `0${no}` : no}
            </div>
            <p className="w-[15%] text-sm">{date}</p>
            <div className="w-[100px] md:w-1/4  text-sm capitalize">
                <div className="px-[10px] w-auto inline-flex items-center gap-[4px] py-[3px] rounded-full"
                     style={statusStyles}>
                    <span className="w-[6px] h-[6px] rounded-full"
                          style={{backgroundColor: statusStyles?.color}}></span>
                    {status}
                </div>
            </div>
            <p className="hidden md:block w-[15%] text-sm">₵{amount.toLocaleString("en-US", {
                style: "decimal",
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
            })}</p>
            <p className="hidden md:block w-[15%] text-sm">{plan}</p>
            <div className="hidden  w-[15%]  text-sm md:flex justify-end">
                <BsThreeDotsVertical className="text-black "/>
            </div>
        </div>
    );
};

export default BillingRow;

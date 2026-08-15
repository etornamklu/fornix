import React from "react";
import Image from "next/image";

import CoinsImage from "@/assets/coins.png";

const usage = [
    {
        received: 50000,
        date: "25/09/24",
        used: 44500,
    },
    {
        received: 50000,
        date: "25/09/24",
        used: 44000,
    },
    {
        received: 1000,
        date: "25/09/24",
        used: 900,
    },
    {
        received: 50000,
        date: "25/09/24",
        used: 47400,
    },
];

const Tokens = () => {
    return (
        <div className="">
            <h2 className="text-3xl font-bold mb-[4px]">Tokens and Usage</h2>
            <p className="text-gray-500">
                Running workflows on Fornix costs tokens. If you run out of tokens you won&apos;t be able to run these
                service any more. To get more credits, upgrade to our Premium plan.
            </p>

            <div
                className="w-full mt-8 rounded-[24px] flex flex-col md:flex-row md:items-center justify-start gap-2 p-6 md:p-8 bg-gray-100">
                <div className="w-9 h-9 relative flex items-center justify-center ">
                    <Image src={CoinsImage} alt="Coins" fill/>
                </div>
                <p className="text-2xl font-semibold">You have 4,400 total credits available</p>
            </div>

            <section className="mt-12 ">
                <h3 className="text-xl font-bold">Usage history</h3>

                <div className="w-full overflow-x-auto">
                    <div className="w-[150%] md:w-full">
                        <div
                            className="w-full flex bg-gray-100 border-[1px] rounded-[8px] items-center justify-between mt-2 gap-3 p-2 border-border">
                            <div className="w-1/2 text-sm text-gray-600 flex items-center gap-3 justify-start">
                                <span className="w-4 block h-4 rounded-[5px] border-[1px]"></span>
                                Tokens received
                            </div>
                            <p className="w-[15%] text-sm text-gray-600">Date</p>
                            <div className="w-1/3 text-right pr-2 text-sm text-gray-600">Tokens used</div>
                        </div>

                        <div>
                            {usage?.map(({date, received, used}, index) => (
                                <div
                                    className="w-full flex  border-[1px] rounded-[8px] items-center justify-between mt-2 gap-3 p-4 border-border"
                                    key={index}>
                                    <div className="w-1/2 text-sm flex items-center gap-3 justify-start">
                                        <span className="w-4 block h-4 rounded-[5px] border-[1px]"></span>
                                        Received {received.toLocaleString("en-US", {
                                        style: "decimal",
                                        maximumFractionDigits: 2
                                    })} tokens
                                    </div>
                                    <p className="w-[15%] text-sm">{date}</p>
                                    <div className="w-1/3 text-right pr-2 text-sm">{used.toLocaleString("en-US", {
                                        style: "decimal",
                                        maximumFractionDigits: 2
                                    })}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Tokens;

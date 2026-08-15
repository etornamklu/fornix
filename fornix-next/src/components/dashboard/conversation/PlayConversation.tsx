import React from "react";
import Link from "next/link";

import {FaPlay} from "react-icons/fa";
import {IoClose} from "react-icons/io5";

export const Conversation = ({goHome}: { goHome: () => void }) => {
    return (
        <main className="w-full h-full pb-4 md:h-[86vh] overflow-y-auto relative">
            <div className="bg-gray-100 rounded-[25px] p-8 px-32 h-[90vh] w-full">
                <div className="w-full h-auto mb-3 flex items-center justify-end">
                    <button className="flex flex-col bg-white rounded-full p-2 gap-2 items-center justify-center"
                            onClick={goHome}>
                        <IoClose className="text-2xl"/>
                    </button>
                </div>
                <div className="w-full h-[calc(100%-64px)] rounded-[15px] flex items-center justify-center bg-white">
                    <button className="flex flex-col gap-2 items-center justify-center">
						<span className="flex items-center justify-center p-4 bg-slate-200 rounded-full">
							<FaPlay/>
						</span>
                        <p className="font-bold italic">Play</p>
                    </button>
                </div>
            </div>
            <p className="text-center text-sm mt-3 text-[#8C96A5]">
                Fornix AI may display inaccurate info, so double-check its responses.{" "}
                <Link href="" className="underline">
                    Your privacy
                </Link>{" "}
            </p>
        </main>
    );
};

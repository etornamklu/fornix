import React, {useMemo} from "react";

const Scale = ({value, setValue}: any) => {
    const progress = useMemo(() => {
        let pro = ((value - 1) / 4) * 100;
        pro += value == 2 ? 4 : value == 3 ? 2.5 : value == 4 ? 1 : 0;
        return pro;
    }, [value]);

    return (
        <div className="w-full h-auto">
            <div className="w-full relative bg-gray-400 flex items-center justify-between  h-5 rounded-full">
                <div className="h-full bg-[#16A34A]  rounded-full" style={{width: `${progress}%`}}></div>
                <div
                    className="absolute top-0  h-full rounded-full flex items-center justify-between left-0 w-full z-[4] px-[3px]">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div className="" key={item}>
                            <button
                                type="button"
                                className={`text-sm font-bold w-4 h-4 ${value !== item ? "bg-transparent" : "bg-white"} flex items-center justify-center rounded-full`}
                                onClick={() => setValue(item)}>
                                <span
                                    className={`block rounded-full ${value == item ? "bg-white" : item > value ? "bg-[#D9D9D9]" : "bg-[#86EFAC]"} w-2 h-2`}></span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full flex items-center justify-between rounded-full px-2">
                {[1, 2, 3, 4, 5].map((item) => (
                    <p key={item} className="text-sm font-bold">
                        {item}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default Scale;

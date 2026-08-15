import React from "react";

type OthersProps = {
    caption: string;
    complete?: boolean;
}[];

const Others = ({
                    others,
                    onClick,
                }: {
    others: OthersProps;
    onClick?: () => void;
}) => {
    return (
        <div className="bg-[#FBF2D5] rounded-2xl px-2 py-4 flex flex-col gap-4">
            <p className="font-medium uppercase">Others</p>
            <ul className="px-2 flex flex-col gap-2">
                {others.map((other, index) => (
                    <OthersCaption
                        key={index}
                        caption={other.caption}
                        complete={other.complete}
                        onClick={onClick}
                    />
                ))}
            </ul>
        </div>
    );
};

interface OthersCaptionProps {
    caption: string;
    complete?: boolean;
    onClick?: () => void;
}

export const OthersCaption = ({
                                  caption,
                                  complete,
                                  onClick,
                              }: OthersCaptionProps) => {
    return (
        <li
            className={`${
                complete ? "bg-white/50" : "bg-white"
            } px-3 py-2 rounded-lg flex justify-between cursor-pointer`}
            onClick={onClick}
        >
            <div className="flex gap-1 items-center">
                <span className="text-sm font-light">{caption}</span>
                <i className="material-symbols-outlined text-xs">info</i>
            </div>
            {complete && (
                <i className="material-icons text-[#22C55E]/50">check_box</i>
            )}
        </li>
    );
};

export default Others;

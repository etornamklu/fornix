/* eslint-disable @next/next/no-img-element */
"use client";
import Styles from "@/components/dashboard/message.module.css";
import {LogoVariants} from "@/utils/types";
import {useState} from "react";
import {LogoAsset} from "../assets/LogoAsset";

const MessagesField = ({
                           children,
                       }: Readonly<{ children?: React.ReactNode }>) => {
    return (
        <div className="flex flex-col gap-8 bg-[#F4F6FB] w-full h-full p-6 rounded-2xl relative">
            {children}
        </div>
    );
};

type MessageProps = { message: string } & MessageAvatarProps;

const SendMessage = ({message, avatar}: MessageProps) => {
    const [fullHeight, setFullHeight] = useState(false);
    return (
        <div className="flex flex-col gap-2">
            <MessageAvatar user={"doctor"} avatar={avatar}/>
            <div className={`pl-8`}>
                <div
                    className={`flex h-full max-w-sm lg:max-w-2xl px-4 py-4 text-white cursor-pointer rounded-xl ${
                        !fullHeight && "max-h-28"
                    } ${Styles.sendMessage}`}
                    onClick={() => setFullHeight(!fullHeight)}
                >
                    <div className={`w-full py-1 overflow-hidden`}>
                        <p className={`${!fullHeight && Styles.textOverflow}`}>{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReceiveMessage = ({message}: { message: string }) => {
    const [fullHeight, setFullHeight] = useState(true);
    return (
        <div className="flex flex-col gap-2 w-full">
            <MessageAvatar user={"fornix"}/>
            <div className={`pr-8 md:self-end lg:min-w-full xl:min-w-[42rem]`}>
                <div
                    className={`flex h-full w-full  px-4 py-4 text-black cursor-pointer rounded-xl ${
                        !fullHeight && "max-h-28"
                    } bg-white ${Styles.receiveMessage}`}
                    onClick={() => setFullHeight(!fullHeight)}
                >
                    <div className={`w-full py-1 overflow-hidden`}>
                        <p className={`${!fullHeight && Styles.textOverflow}`}>{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MessageAvatarProps {
    avatar?: string;
    user?: "doctor" | "fornix";
}

export const MessageAvatar = ({avatar, user}: MessageAvatarProps) => {
    if (user === "fornix")
        return (
            <div className={`flex w-full justify-end`}>
                <LogoAsset
                    size={30}
                    title={false}
                    isMessageHeader
                    variant={LogoVariants.primary}
                />
            </div>
        );

    return (
        <div className="flex gap-2 items-center">
            <img
                src={avatar ?? "https://picsum.photos/2800/4000"}
                alt={`profile img`}
                className="w-8 h-8 rounded-full"
            />
            <span className="text-lg font-medium">You</span>
        </div>
    );
};

const MessageFiledExamples = () => {
    return (
        <>
            <SendMessage
                message="21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and disorientation 21-year-old man with a history of strokes presenting with confusion and dis"/>
            <ReceiveMessage message="laskdas askjad lorem"/>
        </>
    );
};

export {SendMessage, ReceiveMessage, MessageFiledExamples};

export default MessagesField;

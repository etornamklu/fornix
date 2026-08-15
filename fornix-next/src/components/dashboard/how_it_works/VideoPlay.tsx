"use client"
import React, { Dispatch, SetStateAction, useRef } from "react"
import CloseBtn from "@/components/ui/CloseBtn"
import { DashboardPath } from "@/utils/types"
import YouTube from "react-youtube"

type Props = {
    // setActiveTab: Dispatch<SetStateAction<DashboardPath>>;
}

const VideoPlay = ({}: Props) => {
    // YouTube video options
    const videoId = "Y6uIJlgL5rs"
    const opts = {
        height: "100%",
        width: "100%",
        playerVars: {
            autoplay: 0, // Autoplay off initially
            controls: 1, // Enable native YouTube controls
            rel: 0 // Disable related videos
        }
    }

    return (
        <div className="relative flex items-center justify-center w-full h-screen">
            <div className="relative w-[600px] h-[400px] bg-white rounded-2xl shadow-md flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="absolute z-50 mb-2 -top-[6px] -right-[6px]">
                    <CloseBtn />
                </div>

                <div className="relative w-full h-full">
                    <YouTube videoId={videoId} opts={opts} className="w-full h-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export default VideoPlay

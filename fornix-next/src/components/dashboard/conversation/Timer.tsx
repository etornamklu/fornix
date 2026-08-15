import padNumber from "@/utils/padNumber";
import React from "react";
import { useMemo } from "react";

const Timer = ({ timeElapsed, isPlaying }: { timeElapsed: number; isPlaying: boolean }) => {
	// Timer
	const timer = useMemo(() => {
		const seconds = timeElapsed % 60 || 0;
		const minutes = Math.floor(timeElapsed / 60) % 60 || 0;
		const hours = Math.floor(timeElapsed / 3600) % 60 || 0;
		return { minutes, seconds, hours };
	}, [timeElapsed]);
	return (
		<h3 className={`text-6xl font-bold mt-2 ${isPlaying && timeElapsed > 0 && "text-[#9DA4AE]"}`}>
			{padNumber(timer?.hours as number)}:{padNumber(timer?.minutes as number)}:<span className="text-[#9DA4AE]">{padNumber(timer?.seconds as number)}</span>
		</h3>
	);
};

export default Timer;

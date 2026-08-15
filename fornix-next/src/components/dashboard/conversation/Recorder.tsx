import React, { useRef, useState } from "react";
import Image from "next/image";
import { useEffect } from "react";

import FlatTrack from "@/assets/flat.png";
import PitchedTrack from "@/assets/pitched.png";

const Recorder = ({ stream, audioContext, timeElapsed }: { timeElapsed: number; stream: MediaStream | null; audioContext: AudioContext | null }) => {
	let [audioChunks, setAudioChunks] = useState<Blob[]>([]);
	const analyserRef = useRef<AnalyserNode | null>(null);

	// Media recorder
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);

	// Set listeners
	useEffect(() => {
		const readBlob = (event: BlobEvent) => {
			setAudioChunks((prev) => [...prev, event.data]);
		};

		const clearRecordingIcon = () => {
			stream?.getTracks().forEach((t: any) => {
				t.stop();
				t.enabled = false;
			});

			if (audioContext?.state !== "closed") audioContext?.close();
			analyserRef?.current?.disconnect();
		};

		if (stream && audioContext) {
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;

			// Create a MediaStreamSource  and an analyzer node
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			source.connect(analyser);

			analyser.fftSize = 2048;
			analyserRef.current = analyser;

			mediaRecorder.addEventListener("dataavailable", readBlob);
		}

		return () => {
			mediaRecorderRef?.current?.removeEventListener("dataavailable", readBlob);
			// Clear audio tracks and remove the recording icon
			clearRecordingIcon();
		};
	}, [stream, audioContext]);

	return (
		<div className="my-10 h-12 w-full md:w-[450px] relative">
			<Image src={timeElapsed === 0 ? FlatTrack : PitchedTrack} alt="Sound track" fill />
		</div>
	);
};

export default Recorder;

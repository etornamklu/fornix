import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"

import padNumber from "@/utils/padNumber"

import { BsStop } from "react-icons/bs"
import { CgPlayPauseR } from "react-icons/cg"
import { AiOutlineReload } from "react-icons/ai"
import { IoPlayOutline } from "react-icons/io5"
import { LuPencilLine } from "react-icons/lu"

import Recording from "@/assets/recording.svg"
import StartRecording from "@/assets/start.svg"
import StoppedRecording from "@/assets/paused.svg"
import { useAudioStore } from "../../../../store/AudioStore"
import { useTimer } from "./useTimer"

import { motion } from "framer-motion"

interface IRecordConversation {
    patientName: string
    setStep: (value: number) => void
}

const RecordConversation = ({ patientName, setStep }: IRecordConversation) => {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [audioChunks, setAudioChunks] = useState<Blob[]>([])
    const { setAudioBlob, clearAudioBlob } = useAudioStore()
    const [audioURL, setAudioURL] = useState<string | null>(null)
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null)

    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameId = useRef<number | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [commands, setCommands] = useState({
        isRecording: false,
        isReset: false,
        isEnded: true,
        isPaused: false
    })
    const { timeElapsed, time, resetTimer } = useTimer(commands.isRecording)

    useEffect(() => {
        clearAudioBlob()
    }, [])

    useEffect(() => {
        //setup audio context and analyzer when the component mounts
        const setUpAudioContext = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            })
            streamRef.current = stream

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const analyzer = audioCtx.createAnalyser()
            analyzer.fftSize = 2048

            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyzer)

            setAudioContext(audioCtx)
            analyserRef.current = analyzer

            const recorder = new MediaRecorder(stream)
            setMediaRecorder(recorder)
        }

        setUpAudioContext()
        return () => {
            //clean up on unmount
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
        }
    }, [])

    const startRecording = () => {
        if (mediaRecorder && !commands.isRecording && audioContext) {
            if (mediaRecorder.state === "paused") {
                mediaRecorder.resume()
            } else {
                setAudioChunks([])
                // Ensure ondataavailable is properly set
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        setAudioChunks(prev => [...prev, event.data])
                    }
                }
                mediaRecorder.start(1000)
            }
            audioContext.resume()

            setCommands({
                isRecording: true,
                isEnded: false,
                isPaused: false,
                isReset: false
            })
            visualize()
        }
    }

    //visualizing audio recording
    const visualize = () => {
        if (!canvasRef.current || !analyserRef.current) {
            alert(!!canvasRef.current)
            return
        }
        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext("2d")
        if (!canvasCtx) return

        const analyser = analyserRef.current
        const bufferLength = analyser.fftSize
        const dataArray = new Uint8Array(bufferLength)

        const drawWaves = () => {
            analyser.getByteTimeDomainData(dataArray)

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

            canvasCtx.lineWidth = 4
            canvasCtx.strokeStyle = "#9DA4AE"
            canvasCtx.beginPath()

            const sliceWidth = (canvas.width * 1.0) / bufferLength
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = (v * canvas.height) / 2

                if (i === 0) {
                    canvasCtx.moveTo(x, y)
                } else {
                    canvasCtx.lineTo(x, y)
                }

                x += sliceWidth
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2)
            canvasCtx.stroke()

            // Repeat drawing
            animationFrameId.current = requestAnimationFrame(drawWaves)
        }
        drawWaves()
    }

    //stop recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
                const audioURL = URL.createObjectURL(audioBlob)
                setAudioURL(audioURL)
                setAudioBlob(audioBlob)
            }

            mediaRecorder.stop()

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop()
                })
            }
        }

        setCommands({
            isEnded: true,
            isPaused: false,
            isRecording: false,
            isReset: false
        })

        clearCanvas()
    }

    //pause recording
    const pauseRecording = () => {
        console.log(commands)
        if (mediaRecorder && commands.isRecording) {
            //pause visualizer//save recording to local storage.
            const audioBlob = new Blob(audioChunks, { type: "audio/mp3" })
            const audioURL = URL.createObjectURL(audioBlob)

            if (audioURL) {
                localStorage.setItem("audioURL", audioURL)
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current)
            }

            mediaRecorder.pause()
            setCommands({
                isPaused: true,
                isEnded: false,
                isReset: false,
                isRecording: false
            })
        }
    }

    //resume recording
    const resumeRecording = () => {
        if (mediaRecorder && audioContext) {
            if (mediaRecorder.state === "paused") {
                // Resume the paused recording
                mediaRecorder.resume()
                setCommands({
                    isRecording: true,
                    isEnded: false,
                    isPaused: false,
                    isReset: false
                })
                audioContext.resume()
                visualize() // Continue visualizing the audio
            } else if (mediaRecorder.state === "inactive") {
                // Start a new recording session
                mediaRecorder.start()
                mediaRecorder.ondataavailable = event => {
                    setAudioChunks(prev => [...prev, event.data])
                }
                setCommands({
                    isRecording: true,
                    isEnded: false,
                    isPaused: false,
                    isReset: false
                })
                audioContext.resume()
                visualize() // Start visualizing the audio
            }
        }
    }

    const resetRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop()
        }

        resetTimer()
        setAudioChunks([])

        setCommands({
            isReset: true,
            isRecording: false,
            isEnded: false,
            isPaused: false
        })
        //clear visualizer
        clearCanvas()
    }

    const clearCanvas = () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current)
        }
        const canvas = canvasRef.current
        if (canvas) {
            const canvasCtx = canvas.getContext("2d")
            if (canvasCtx) {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
            }
        }
    }

    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    return (
        <motion.main
            initial="hidden"
            animate="visible"
            variants={fadeAnimation}
            exit="hidden"
            className="w-full max-w-[550px] flex flex-col items-center justify-center mx-auto py-5 overflow-y-auto h-[calc(100%)] relative">
            <div className="bg-white  mt-3 rounded-[25px] p-4 flex items-center justify-center flex-col  h-auto w-full">
                <p className="flex items-center text-[#111111] font-medium justify-center gap-[3px]">
                    {patientName}
                    <span>
                        <LuPencilLine className="text-[#9DA4AE]" />
                    </span>
                </p>
                <div className="w-full mt-12 flex items-center justify-center flex-col">
                    <div className="flex items-center justify-center gap-[4px]">
                        <span className="w-6 h-6 relative block">
                            <Image
                                src={
                                    timeElapsed === 0
                                        ? StartRecording
                                        : commands.isRecording
                                          ? Recording
                                          : StoppedRecording
                                }
                                fill
                                alt="Recording status"
                            />
                        </span>
                        {timeElapsed == 0 && <p>Ready to record</p>}
                        {timeElapsed > 0 && (
                            <>
                                {commands.isRecording && (
                                    <p>
                                        Recording conversation with{" "}
                                        <span className="font-bold opacity-80">{patientName}</span>
                                    </p>
                                )}
                                {!commands.isRecording && (
                                    <p>
                                        Recording with <span className="font-bold opacity-80">{patientName}</span>{" "}
                                        paused
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    <h3
                        className={`text-6xl font-bold mt-2 ${
                            !commands.isRecording && timeElapsed > 0 && "text-[#9DA4AE]"
                        }`}>
                        {padNumber(time.hours as number)}:{padNumber(time.minutes as number)}:
                        <span className="text-[#9DA4AE]">{padNumber(time.seconds as number)}</span>
                    </h3>

                    <div className="my-10 h-10  w-full md:w-[450px] flex flex-col justify-center">
                        <canvas
                            ref={canvasRef}
                            width={"450"}
                            height={"50"}
                            className="w-full overflow-hidden block text-[#9DA4AE]"></canvas>
                    </div>

                    {timeElapsed === 0 && !commands.isReset && commands.isEnded && (
                        <button className="w-20 mt-2 h-20 text-white record-btn rounded-full" onClick={startRecording}>
                            Record
                        </button>
                    )}

                    {(timeElapsed >= 0 || commands.isReset) && !commands.isEnded && (
                        <div className="w-auto gap-4 flex my-3 items-center justify-between">
                            <button
                                className="w-full px-3 text-[#475569] text-sm font-bold flex rounded-[7px] py-[6px] items-center bg-[#F1F5F9] justify-center gap-[6px]"
                                onClick={resetRecording}>
                                <AiOutlineReload />
                                Reset
                            </button>
                            <button
                                className="w-full px-3 text-[#00549E] text-sm font-bold flex rounded-[10px] py-[12px] items-center bg-[#3CA2FB]/30 justify-center gap-[6px]"
                                onClick={commands.isRecording ? pauseRecording : resumeRecording}>
                                {commands.isRecording ? (
                                    <CgPlayPauseR className="text-xl" />
                                ) : (
                                    <IoPlayOutline className="text-xl" />
                                )}
                                {commands.isRecording ? "Pause" : timeElapsed === 0 ? "Start" : "Resume"}
                            </button>
                            <button
                                className="w-full px-3 text-[#B91C1C] text-sm font-bold flex rounded-[7px] py-[6px] items-center bg-[#FEF2F2] justify-center gap-[2px]"
                                onClick={() => {
                                    stopRecording()
                                    //move to the transcription page
                                    setStep(2)
                                }}>
                                <BsStop className="text-xl" />
                                End
                            </button>
                        </div>
                    )}

                    <p className="text-[#8C96A5] text-sm mt-4 text-center">
                        This session will be transcribed and presented in a history taking note{" "}
                    </p>
                </div>
            </div>
        </motion.main>
    )
}

export default RecordConversation

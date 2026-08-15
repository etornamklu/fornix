import React, { useEffect } from "react"

const LoadingDiagnosis = ({ loadingText, size }: { loadingText: string; size?: number }) => {
    useEffect(() => {
        async function getLoader() {
            const { waveform } = await import("ldrs")
            waveform.register()
        }

        getLoader()
    }, [])

    return (
        <div className={`p-3 w-full flex justify-center items-center ${loadingText && " mt-4 gap-5 "}`}>
            <l-waveform size={size ?? 20} stroke={size ? (3.5 / 20) * size : 3.5} speed={1} color={"#2059df"} />
            {loadingText}
        </div>
    )
}

export default LoadingDiagnosis

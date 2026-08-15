export const RadialProgressBar = ({size, radius, progress}: { size: number, radius: number, progress: number }) => {
    const width = `w-${size}`
    const height = `h-${size}`
    const circumference = Number((2 * Math.PI * radius).toFixed(1))
    const strokeDashOffset = (circumference - (circumference * progress) / 100)

    return (
        <div className={`relative ${width} ${height}`}>
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-gray-200 stroke-current"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                />

                <circle
                    className="text-blue-600  progress-ring__circle stroke-current"
                    strokeWidth="10"
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={`${strokeDashOffset}px`}
                />
            </svg>
        </div>
    )
}
import { useState, useEffect, useCallback } from 'react';

export const useTimer = (isRecording = false) => {
    const [timeElapsed, setTimeElapsed] = useState(0);

    const formatTime = useCallback((totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            hours,
            minutes,
            seconds,
            // Optional: formatted string for display
            formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        };
    }, []);

    useEffect(() => {
        let intervalId: any;

        if (isRecording) {
            intervalId = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isRecording]);

    const resetTimer = useCallback(() => {
        setTimeElapsed(0);
    }, []);

    const pauseTimer = useCallback(() => {
        setTimeElapsed(prev => prev);
    }, []);

    return {
        time: formatTime(timeElapsed),
        resetTimer,
        pauseTimer,
        timeElapsed
    };
};
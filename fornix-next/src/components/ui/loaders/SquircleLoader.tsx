import {useEffect} from "react";

export const SquircleLoader = (
    {
        size,
        speed,
        stroke,
        color,
        ...props
    }: {
        size: number;
        speed: number;
        stroke: number;
        color: string;
        [key: string]: any;
    }) => {
    useEffect(() => {
        async function getLoader() {
            const {squircle} = await import('ldrs')
            squircle.register()
        }

        getLoader()
    }, [])

    return <l-squircle
        size={size}
        speed={speed}
        stroke={stroke}
        color={color}
        {...props}
    />
}
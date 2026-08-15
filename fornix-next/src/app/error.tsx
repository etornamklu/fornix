'use client' // Error boundaries must be Client Components

import {LogoAsset} from "@/components/assets/LogoAsset";
import {LogoVariants} from "@/utils/types";

export default function GlobalError(
    {
        error,
        reset,
    }: {
        error: Error & { digest?: string }
        reset: () => void
    }) {
    return (
        // global-error must include html and body tags
        <html>
        <body>
        <div className='flex flex-col gap-4 w-full h-screen justify-center items-center'>
            <LogoAsset size={50} title={true} variant={LogoVariants.primary}/>
            <h2>Something went wrong!</h2>
            <a href="/" className='bg-blue-500 text-white px-4 py-2 rounded-xl'>
                Go Home
            </a>
        </div>
        </body>
        </html>
    )
}
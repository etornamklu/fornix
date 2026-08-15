import React from "react"
import { LogoVariants } from "@/utils/types"
import primary from "../../../public/images/logo-primary.png"
import plain from "../../../public/images/logo-plain.png"
import logoWithTitle from "../../../public/images/logo-text-primary.png"
import Image from "next/image"

export const LogoAsset = ({
    size,
    title,
    variant,
    isMessageHeader,
    href
}: {
    size: number
    title: boolean
    variant: LogoVariants
    isMessageHeader?: boolean
    href?: string
}) => {
    let logoSrc

    switch (variant) {
        case LogoVariants.primary:
            logoSrc = primary
            break
        case LogoVariants.plain:
            logoSrc = plain
            break
        default:
            logoSrc = primary
    }

    return (
        <div className="flex gap-3 justify-center items-center">
            <div className="flex justify-center items-center">
                {isMessageHeader && (
                    <div className="flex text-lg font-medium pr-2">
                        <span className="text-gray-700">Fornix</span>
                    </div>
                )}
                {title ? (
                    <Image src={logoWithTitle.src} alt={`logo-${variant}`} height={size} width={size} className={``} />
                ) : (
                    <Image src={logoSrc} alt={`logo-${variant}`} height={size} width={size} className={``} />
                )}
                {/*<Image src={logoSrc} alt={`logo-${variant}`} height={size} width={size} className={``}/>*/}
            </div>

            {/*{title && (*/}
            {/*    <div className="flex gap-1 text-2xl font-bold">*/}
            {/*        <span className="text-gray-700">Fornix</span>*/}
            {/*        <span className="text-cyan-500">AI</span>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    )
}

import Style from "./styles/features.module.css"
import Image, { StaticImageData } from "next/image"

import CPU from "../../../public/images/landing/processor.png"
import Brain from "../../../public/images/landing/brain.png"
import LogoAndFeatures from "../../../public/images/landing/logo_and_features.png"
import Shapes from "../../../public/images/landing/shapes.png"

const Features = () => {
    return (
        <div className={`${Style.LogoWrapper} bg-[#051729] isolate relative overflow-hidden`} id="features">
            <div className="flex justify-center py-20 gap-20 px-4 md:px-6 lg:px-8 text-white">
                <div className={`${Style.LogoBg} absolute left-0 top-0 h-60 md:h-96 w-full`}></div>
                <div className="flex flex-col gap-20 md:gap-32">
                    <div className="flex flex-col items-center gap-8">
                        <div className="bg-[#051729]/50 px-4 py-2 rounded-3xl max-w-fit">
                            <span>Precision Perfected</span>
                        </div>
                        <div className="max-w-lg text-center">
                            <p className="text-4xl md:text-5xl font-bold">Clinician-Grade AI That Respects the Craft</p>
                        </div>
                    </div>
                    <div>
                        <GalleryContent />
                    </div>
                </div>
            </div>
        </div>
    )
}

interface ContentProps {
    caption: string
    desc: string
    image: StaticImageData
}

function GalleryContent() {
    const content: ContentProps[] = [
        {
            caption: "Domain-Trained Models",
            desc: "Our LLMs aren’t scraped from Reddit — they’re trained on structured medical knowledge and regional care data",
            image: CPU
        },
        {
            caption: "Ethical by Design",
            desc: "Built for transparency, explainability, and equity. Compliant with global standards for privacy and accountability.",
            image: LogoAndFeatures
        },
        {
            caption: "Human + AI Review Loop",
            desc: "You're always in the loop. Our system learns from your input and improves with every shift you work",
            image: Shapes
        },
        {
            caption: "Natural Language Feedback Mechanism",
            desc: "Fornix AI incorporates a feedback system for practitioners to share insights and preferences, aiding ongoing system enhancement",
            image: Brain
        }
    ]

    return (
        <div>
            <div className="grid md:grid-cols-2 gap-6">
                {/* left */}
                <div className="flex h-fit flex-col gap-6 w-full overflow-hidden">
                    <div className={`rounded-3xl bg-[#071F37] h-full md:max-w-xl`}>
                        <div className={`flex flex-col gap-6`}>
                            <div className="px-6 pt-6 flex flex-col gap-1">
                                <p className="text-lg font-bold">{content[0].caption}</p>
                                <p className="text-sm">{content[0].desc}</p>
                            </div>
                            <div className="flex justify-center h-full">
                                <Image
                                    src={content[0].image.src}
                                    width={content[0].image.width}
                                    height={content[0].image.height}
                                    alt={content[0].image.src}
                                    className="h-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-3xl pt-6 px-6 md:max-w-xl bg-[#071F37]`}>
                        <div className={`flex flex-col h-full`}>
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-bold">{content[1].caption}</p>
                                <p className="text-sm">{content[1].desc}</p>
                            </div>
                            <div className="rounded-2xl flex justify-center pt-2">
                                <Image
                                    src={content[1].image.src}
                                    width={content[1].image.width}
                                    height={content[1].image.height}
                                    alt={content[1].image.src}
                                    className="h-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* right */}
                <div className="flex flex-col gap-6 md:items-end w-full">
                    <div className={`px-6 rounded-3xl h-full md:max-w-xl bg-[#071F37]`}>
                        <div className={`flex flex-col-reverse justify-center h-full gap-6`}>
                            <div className="pb-6 flex flex-col gap-1">
                                <p className="text-lg font-bold">{content[2].caption}</p>
                                <p className="text-sm">{content[2].desc}</p>
                            </div>
                            <div className="rounded-2xl flex justify-center">
                                <Image
                                    src={content[2].image.src}
                                    width={content[2].image.width}
                                    height={content[2].image.height}
                                    alt={content[2].image.src}
                                    className="h-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`px-6 pb-6 rounded-3xl bg-[#071F37] md:max-w-xl`}>
                        <div className={`flex flex-col-reverse gap-6`}>
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-bold">{content[3].caption}</p>
                                <p className="text-sm">{content[3].desc}</p>
                            </div>
                            <div className="p-6 flex justify-center rounded-3xl bg-[#071F37]">
                                <Image
                                    src={content[3].image.src}
                                    width={content[3].image.width}
                                    height={content[3].image.height}
                                    alt={content[3].image.src}
                                    className="h-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Features

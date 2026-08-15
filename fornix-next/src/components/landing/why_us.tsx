import Image, { StaticImageData } from "next/image"
import Style from "./styles/why_us.module.css"

import DiagnosisChat from "../../../public/images/landing/chat.jpg"
import RadiologyImage from "../../../public/images/landing/radiology_image_upload.png"
import PatientSummaryChat from "../../../public/images/landing/patient_summary_chat.png"
import ShimmerLoading from "../../../public/images/landing/shimmer_loading.jpg"

const WhyFornix = () => {
    return (
        <div className={`${Style.LogoWrapper} bg-[#f1f8fe] isolate relative overflow-hidden`} id="why-us">
            <div className="py-20 flex flex-col gap-20 px-4 md:px-6 lg:px-8">
                <div className={`${Style.LogoBg} absolute left-0 top-0 h-60 md:h-96 w-full`}></div>
                <WhyUsHeading />
                <WhyUsContent />
            </div>
        </div>
    )
}

function WhyUsHeading() {
    return (
        <div className="grid md:grid-cols-2 place-items-center gap-6">
            <div className="flex gap-6 md:gap-4 flex-col">
                <div className="rounded-full w-fit px-4 py-2 bg-white shadow">
                    <span>Why us</span>
                </div>
                <div className="w-full">
                    <p className="font-bold text-balance text-2xl md:text-4xl">
                        Fornix doesnt replace clinicians. It empowers them. Think of it as an extra pair of clinical
                        hands, ears, and eyes — always learning, never tired.
                    </p>
                </div>
            </div>

            <div className="">
                <div className="max-w-lg">
                    <p className="md:text-lg text-[#475569]">
                        The Healthcare Bottleneck is Real: Documentation fatigue is at an all-time high Cognitive
                        overload is driving burnout Critical decisions are made under pressure, with incomplete data.
                    </p>
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

function WhyUsContent() {
    const content: ContentProps[] = [
        {
            caption: "Clinical Decision Support That Speaks Your Language",
            desc: "Instantly surface possible conditions, red flags, and care pathways based on patient data you already have.",
            image: DiagnosisChat
        },
        {
            caption: "Ambient Note Generation",
            desc: "Stop typing. Fornix listens securely in the background and turns conversations into structured summaries, SOAP notes, or discharge plans.",
            image: RadiologyImage
        },
        {
            caption: "Seamless Integration with EHRs",
            desc: "Whether you're using DHIMS, OpenMRS, or a local EMR, Fornix blends right in. No toggling. No hassle. Just better care continuity",
            image: PatientSummaryChat
        },
        {
            caption: " Conversational History Collection",
            desc: "Let Fornix chat with patients (even in Twi or Hausa) and compile a complete history before they walk into your room.",
            image: ShimmerLoading
        }
    ]

    return (
        <div>
            <div className="grid md:grid-cols-2 gap-6">
                {/* left */}
                <div className="flex flex-col gap-6 md:items-end w-full">
                    <div className={`p-6 rounded-3xl bg-white md:max-w-xl`}>
                        <div className={`flex flex-col-reverse gap-6`}>
                            <div>
                                <p className="text-lg font-bold">{content[0].caption}</p>
                                <p className="text-sm text-[#64748B]">{content[0].desc}</p>
                            </div>
                            <div className="p-6 rounded-2xl overflow-hidden">
                                <Image
                                    src={content[0].image.src}
                                    width={content[0].image.width}
                                    height={content[0].image.height}
                                    alt={content[0].image.src}
                                    className="h-auto object-contain rounded-2xl"
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`p-6 rounded-3xl bg-white md:max-w-xl`}>
                        <div className={`flex flex-col-reverse gap-6`}>
                            <div>
                                <p className="text-lg font-bold">{content[2].caption}</p>
                                <p className="text-sm text-[#64748B]">{content[2].desc}</p>
                            </div>
                            <div className="p-6 rounded-2xl">
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
                </div>
                {/* right */}
                <div className="flex flex-col gap-6 w-full">
                    <div className={`p-6 rounded-3xl bg-white h-full md:max-w-xl`}>
                        <div className={`flex flex-col gap-6`}>
                            <div>
                                <p className="text-lg font-bold">{content[1].caption}</p>
                                <p className="text-sm text-[#64748B]">{content[1].desc}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#F8F9FC]">
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
                    <div className={`h-fit p-6 rounded-3xl bg-white md:max-w-xl`}>
                        <div className={`flex flex-col gap-6`}>
                            <div>
                                <p className="text-lg font-bold">{content[3].caption}</p>
                                <p className="text-sm text-[#64748B]">{content[3].desc}</p>
                            </div>
                            <div className="px-6 pt-6 mt-6 rounded-2xl bg-[#F8F9FC]">
                                <div className="relative isolate overflow-clip">
                                    <div className="flex justify-around gap-4 md:gap-0">
                                        <div className="h-5 w-5 rounded-full bg-[#DCFCE7] self-center"></div>
                                        <Image
                                            src={content[3].image.src}
                                            width={content[3].image.width}
                                            height={content[3].image.height}
                                            alt={content[3].image.src}
                                            className="h-auto object-contain"
                                        />
                                        <div className="h-5 w-5 rounded-full bg-[#FEF3C7]"></div>
                                    </div>

                                    <div className="absolute top-0 px-2 pt-10 mx-auto -z-10 self-end w-full">
                                        <div className="h-96 w-full outline outline-1 outline-[#E7ECF3] rounded-full flex p-8">
                                            <div className="h-96 w-full outline outline-1 outline-[#E7ECF3] rounded-full p-10">
                                                <div className="h-96 w-full outline outline-1 outline-[#E7ECF3] rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WhyFornix

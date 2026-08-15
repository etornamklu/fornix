import React from "react"
import Button from "../global/Button"
import Style from "./styles/hero.module.css"
import Image from "next/image"
import FullWindow from "../../../public/images/landing/full_window.jpg"
import GhanaFlag from "../../../public/images/landing/countries/ghana.png"
// import NigeriaFlag from "../../../public/images/landing/countries/nigeria.png";
import BeninFlag from "../../../public/images/landing/countries/benin.png"
import USAFlag from "../../../public/images/landing/countries/usa.png"
import NorwayFlag from "../../../public/images/landing/countries/norway.png"
import CanadaFlag from "../../../public/images/landing/countries/canada.png"
import Link from "next/link"

const LandingHero = () => {
    return (
        <div className="pb-20 px-4 md:px-6 lg:px-8">
            <Intro />
            <div className="w-full max-w-[56rem] flex mx-auto justify-center -mt-20">
                <Image
                    src={FullWindow.src}
                    width={FullWindow.width}
                    height={FullWindow.height}
                    alt={FullWindow.src}
                    className="rounded-xl"
                />
            </div>
            <div className="flex flex-col items-center">{<TrustedCountries />}</div>
        </div>
    )
}

function Intro() {
    return (
        <div className={`flex flex-col items-center rounded-t-3xl md:rounded-b-3xl ${Style.hero}`}>
            <div className="max-w-lg pb-36 px-6">
                <div className="flex flex-col items-center gap-8 mt-8 md:mt-16">
                    <div className="flex flex-col gap-8 items-center *:text-center *:text-white">
                        <div className="outline outline-1 px-4 py-1 rounded-2xl w-fit outline-slate-100 bg-white/5">
                            <span>Fornix Labs: Built for the Frontline. Powered by You.</span>
                        </div>
                        <div className="w-full md:min-w-[42rem] lg:min-w-[50rem]">
                            <h1 className={`text-5xl md:text-6xl text-balance font-bold ${Style.heading}`}>
                                AI that enhances - not replaces - your clinical judgment
                            </h1>
                        </div>
                        <p className="md:max-w-lg lg:max-w-xl backdrop-brightness-95">
                            Modern healthcare is overwhelmed by documentation, delays, and fragmented experiences.
                            Fornix Labs delivers intelligent, clinician-grade tools that streamline workflows, support
                            sound decision-making, and bring clarity to every point of care — for both those who treat
                            and those seeking answers.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-fit">
                        <Link href="/auth/signup" className="relative">
                            <Button className="w-full bg-gradient-to-br px-6 to-[#3CA2FB] from-[#03549B]" size="lg">
                                Try for free
                            </Button>
                        </Link>
                        {/*<Button*/}
                        {/*    variant="plain"*/}
                        {/*    size="lg"*/}
                        {/*    className="bg-white/30 text-white"*/}
                        {/*>*/}
                        {/*    Learn more*/}
                        {/*</Button>*/}
                    </div>
                </div>
            </div>
        </div>
    )
}

interface Country {
    name: string
    flag: string
}

function TrustedCountries() {
    const countries: Country[] = [
        { name: "Ghana", flag: GhanaFlag.src },
        // {name: "Nigeria", flag: NigeriaFlag.src},
        { name: "Benin", flag: BeninFlag.src },
        { name: "USA", flag: USAFlag.src },
        { name: "Norway", flag: NorwayFlag.src },
        { name: "Canada", flag: CanadaFlag.src }
    ]

    return (
        <div className="relative h-full flex items-end min-h-52 md:min-h-64">
            <div className="flex flex-col items-center w-full h-full">
                <div
                    className={`${Style.CountryLines} isolate -z-10 absolute top-0 h-full w-11/12  md:w-full min-h-40 max-h-48 md:max-h-60 md:min-h-60`}></div>
                <div className="flex flex-col items-center gap-4 md:gap-6 lg:gap-8 text-center">
                    <p>Trusted by clinicians across the Globe </p>
                    <div>
                        <ul className="flex items-center justify-center gap-6 md:gap-10">
                            {countries.map((country, index) => {
                                return (
                                    <li key={index}>
                                        <Image src={country.flag} width={60} height={60} alt={country.name} />
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingHero

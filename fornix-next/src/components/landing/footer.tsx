"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Button from "../global/Button"
import Style from "./styles/footer.module.css"
import { LogoAsset } from "../assets/LogoAsset"
import { LogoVariants } from "@/utils/types"

const Footer = () => {
    function FornixText() {
        return (
            <div className="overflow-clip">
                <p
                    className={`${Style.NormsPro} text-[16rem] md:text-[22rem] lg:text-[25rem] capitalize leading-[1] md:leading-[0.9] lg:leading-[0.8]`}>
                    fornix
                </p>
            </div>
        )
    }

    function Copyright() {
        return (
            <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 lg:px-12 gap-4">
                <p className="text-sm text-[#64748B]">
                    &copy; {new Date().getFullYear()} Fornix AI. All rights reserved.
                </p>
                <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                    {/*<p className="text-sm text-[#64748B] text-center md:text-left">*/}
                    {/*    College of Health Building, First Floor, Korle-Bu*/}
                    {/*</p>*/}
                    <div className="flex gap-6">
                        <Link
                            href={"/privacy"}
                            className="text-[#64748B] text-sm hover:text-black transition duration-200">
                            Privacy Policy
                        </Link>
                        <Link
                            href={"https://khelvyn80.github.io/fornix-ai-termsofservice"}
                            className="text-[#64748B] text-sm hover:text-black transition duration-200">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center pt-10 px-4 md:px-8 lg:px-12">
            <div className="w-full flex justify-center">
                <GetInTouch />
            </div>
            <div className="max-w-screen-lg bg-[#F9FAFB] rounded-3xl mt-10 w-full pb-10 shadow-lg">
                <div className="flex flex-col gap-8 px-6 md:px-12 py-10">
                    <FornixText />
                    <QuickLinks />
                </div>
                <hr className="border-gray-300 my-6" />
                <Copyright />
            </div>
        </div>
    )
}

const links = [
    {
        title: "Company",
        links: [
            { title: "About Fornix AI", href: "/about" },
            { title: "Features", href: "#features" },
            { title: "Pricing", href: "/pricing" }
        ]
    },
    {
        title: "Help",
        links: [
            { title: "Contact Us", href: "/contact" },
            { title: "FAQs", href: "#faq" },
            { title: "admin@fornixlabs.com", href: "mailto:admin@fornixlabs.com" }
            // { title: "+233 20 146 2313", href: "tel:+233201462313" }
        ]
    },
    {
        title: "Connect",
        links: [
            {
                title: "LinkedIn",
                href: "https://www.linkedin.com/company/fornix-labs/"
            },
            {
                title: "Instagram",
                href: "https://www.instagram.com/fornix.ai?igsh=amZpcmNvMzMxdTZ4"
            }
        ]
    }
]

function QuickLinks() {
    return (
        <div className="flex flex-col md:flex-row justify-between w-full gap-12">
            <LogoAndAbout />
            <div className="flex flex-wrap gap-10">
                {links.map((section, index) => (
                    <div key={index} className="flex flex-col gap-4">
                        <p className="font-semibold text-lg">{section.title}</p>
                        <ul className="flex flex-col gap-2">
                            {section.links.map((item, idx) => (
                                <li key={idx} className="flex items-center">
                                    <Link
                                        href={item.href}
                                        className="text-[#64748B] hover:text-black transition duration-200">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    )
}

function LogoAndAbout() {
    return (
        <div className="max-w-sm">
            <div className="flex flex-col items-start gap-1">
                <LogoAsset size={50} variant={LogoVariants.primary} title={false} />
                <p className="font-bold text-2xl md:text-3xl">Fornix AI</p>
                <p className="text-sm text-[#9DA4AE]">Pushing AI Boundaries in Global Health</p>
            </div>
        </div>
    )
}

function GetInTouch() {
    const [showForm, setShowForm] = useState(false)

    const images = [
        "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80"
    ]

    return (
        <div className="w-full flex flex-col items-center px-6 lg:px-0 md:max-w-screen-md relative">
            <div className="bg-black py-6 px-6 md:px-8 min-w-full rounded-3xl flex flex-col items-center gap-6">
                <div className="flex -space-x-2">
                    {images.map((image, index) => (
                        <Image
                            src={image}
                            key={index}
                            width={100}
                            height={100}
                            alt="profile"
                            className={`inline-block h-12 w-12 rounded-full ring-2 ring-white ${
                                index === 1 && "z-50 -translate-y-1"
                            }`}
                        />
                    ))}
                </div>

                <div className="text-center flex flex-col gap-1">
                    <p className="text-white font-medium">Still have questions?</p>
                    <p className="text-[#9DA4AE]">Everything you need to know about the product and billing.</p>
                </div>

                <Button size="lg" variant="plain" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Close" : "Get in touch"}
                </Button>

                {showForm && (
                    <div
                        className="absolute top-[120%] left-0 right-0 bg-white rounded-3xl shadow-lg p-6 md:p-8 max-w-lg mx-auto transition-all duration-500 ease-in-out"
                        style={{ zIndex: 1000 }}>
                        <h3 className="text-lg font-semibold text-black mb-4">Contact Us</h3>
                        <form className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Your name"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <input
                                type="email"
                                placeholder="Your email"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <textarea
                                placeholder="Your message"
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"></textarea>
                            <Button size="lg" variant="primary" type="submit">
                                Submit
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Footer

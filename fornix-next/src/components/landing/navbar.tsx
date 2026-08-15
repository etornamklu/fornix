"use client"
import Link from "next/link"
import React from "react"
import { LogoAsset } from "../assets/LogoAsset"
import { LogoVariants } from "@/utils/types"

const LandingNavbar = () => {
    const scrollToElement = (event: { preventDefault: () => void }, selector: string) => {
        event.preventDefault()
        const element = document.querySelector(selector)
        if (!element) return
        element.scrollIntoView({ behavior: "smooth" })
    }

    function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
        return (
            <Link href={href} onClick={e => scrollToElement(e, href)}>
                {children}
            </Link>
        )
    }

    return (
        <header className="py-4 px-4 md:px-6 lg:px-8 sticky top-0 bg-white z-50">
            <nav className="flex justify-between items-center">
                <LogoAsset size={100} title variant={LogoVariants.primary} />

                <ul className="hidden md:flex md:justify-center md:gap-6">
                    <li>
                        <NavLink href="#why-us">Why Fornix</NavLink>
                    </li>
                    <li>
                        <NavLink href="#features">Features</NavLink>
                    </li>
                    {/*<li>*/}
                    {/*    <NavLink href="#pricing">Pricing</NavLink>*/}
                    {/*</li>*/}
                    <li>
                        <Link href="/about">About</Link>
                    </li>
                    <li>
                        <NavLink href="#faq">FAQ</NavLink>
                    </li>
                    {/*<li>*/}
                    {/*    <NavLink href="#reviews">Reviews</NavLink>*/}
                    {/*</li>*/}
                </ul>

                <div className="flex gap-2">
                    <Link href="/auth/signin" className="border border-blue-500 text-blue-700 px-2 py-1 rounded-lg">
                        Log in
                    </Link>
                    <Link href="/auth/signup" className="bg-blue-500 text-white px-2 py-1 rounded-lg">
                        Sign up
                    </Link>
                </div>
            </nav>
        </header>
    )
}

export default LandingNavbar

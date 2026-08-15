"use client"
import React from "react"
import { FaCheckCircle } from "react-icons/fa"
import { LogoAsset } from "@/components/assets/LogoAsset"
import { LogoVariants } from "@/utils/types"
import { FaRegStar, FaRocketchat, FaStar } from "react-icons/fa6"
import { BsEyeglasses } from "react-icons/bs"
import { CiStar } from "react-icons/ci"

const About = () => {
    return (
        <section className="py-16 px-6 lg:px-12 bg-gradient-to-bl from-indigo-100 via-blue-50 to-teal-100">
            <div className="max-w-7xl mx-auto text-center flex flex-col gap-10">
                <LogoAsset size={200} title={true} variant={LogoVariants.primary} />

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-700 mb-6 leading-tight">
                    Welcome to Fornix Labs
                </h1>

                {/* Subheading */}
                <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                    Fornix Labs is an AI-powered health-tech platform designed to support clinics, hospitals,
                    pharmacies, and individual healthcare providers. We make healthcare smarter and more efficient by
                    helping clinicians with diagnosis and management, assisting patients with structured history-taking,
                    and optimizing pharmacy workflows. Our goal is simple—use AI to make healthcare more accessible,
                    accurate, and seamless.
                </p>

                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                    {/* Mission */}
                    <div className="group relative bg-white rounded-2xl shadow-lg p-8 transition duration-300 transform hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                        <h2 className="text-3xl font-semibold text-blue-600 mb-4 flex justify-center items-center gap-5">
                            Our Mission <FaRocketchat size={30} className="" />
                        </h2>
                        <p className="text-gray-600 text-base md:text-lg">
                            To equip clinics, hospitals, and pharmacies with AI-driven tools for better diagnosis,
                            treatment, and patient care.
                        </p>
                    </div>

                    {/* Vision */}
                    <div className="group relative bg-white rounded-2xl shadow-lg p-8 transition duration-300 transform hover:scale-105 hover:shadow-xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                        <h2 className="text-3xl font-semibold text-blue-600 mb-4 flex justify-center items-center gap-5">
                            Our Vision <BsEyeglasses size={40} className="" />
                        </h2>
                        <p className="text-gray-600 text-base md:text-lg">
                            To transform healthcare with AI, making quality medical support available to everyone,
                            everywhere.
                        </p>
                    </div>
                </div>

                {/* Core Values */}
                <div className="group relative bg-white rounded-2xl shadow-lg p-8 transition duration-300 transform hover:shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    <h2 className="text-3xl font-semibold text-blue-600 mb-4 flex justify-center items-center gap-5">
                        Core Values <FaRegStar size={30} className="" />
                    </h2>
                    <div className="group relative bg-white rounded-2xl shadow-lg p-8 transition duration-300 transform hover:shadow-xl">
                        <ul className="space-y-4 text-gray-700 text-base md:text-lg">
                            <li className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                                <FaCheckCircle className="text-teal-500 mr-3" size={24} />
                                <span className="font-medium">Innovation</span> – Pushing boundaries with AI to improve
                                healthcare.
                            </li>
                            <li className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                                <FaCheckCircle className="text-teal-500 mr-3" size={24} />
                                <span className="font-medium">Accessibility</span> – Making quality healthcare available
                                to all.
                            </li>
                            <li className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                                <FaCheckCircle className="text-teal-500 mr-3" size={24} />
                                <span className="font-medium">Accuracy</span> – Ensuring precision in diagnosis and
                                treatment.
                            </li>
                            <li className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                                <FaCheckCircle className="text-teal-500 mr-3" size={24} />
                                <span className="font-medium">Collaboration</span> – Connecting patients, clinicians,
                                and pharmacists seamlessly.
                            </li>
                            <li className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                                <FaCheckCircle className="text-teal-500 mr-3" size={24} />
                                <span className="font-medium">Ethical AI</span> – Prioritizing privacy, safety, and
                                responsible AI use.
                            </li>
                            <li className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                                <FaCheckCircle className="text-teal-500 mr-3" size={24} />
                                <span className="font-medium">Impact-Driven</span> – Focused on real-world healthcare
                                improvements.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About

"use client"

import { useState, useEffect } from "react"
import { BACKEND_BASE_URL } from "@/utils/constants"
import PrimaryButton from "@/components/ui/button"
import Input from "@/components/ui/input"
import Textarea from "@/components/ui/textarea"
import PharmImage from "../../../../public/images/pharmacy.jpg"
import HosImage from "../../../../public/images/hospital-demo.jpg"
import Step from "../../../../public/images/step.jpg"
import Footer from "@/components/landing/footer"
import Navbar from "@/components/landing/navbar"

import "@/app/globals.css"

interface RequestDemoProps {
    slug: string
}

const RequestDemo: React.FC<RequestDemoProps> = ({ slug }) => {
    const [formData, setFormData] = useState({
        fullName: "",
        pharmacyName: "",
        email: "",
        phone: "",
        referral: "",
        notes: ""
    })

    const [pageContent, setPageContent] = useState({
        title: "",
        description: "",
        features: [] as { title: string; desc: string }[],
        whyLove: {
            heading: "",
            items: [] as string[]
        },
        callToAction: {
            heading: "",
            description: "",
            buttonText: ""
        },
        backgroundImage: ""
    })

    useEffect(() => {
        if (slug) {
            switch (slug) {
                case "pharmacy":
                    setPageContent({
                        title: "Request a Demo on Pharmacy Management",
                        description:
                            "Transform Your Pharmacy with AI-Driven Insights. Say goodbye to guesswork and hello to precision! Fornix AI helps you access AI-powered patient summaries and clinical insights, optimizing medication dispensing, improving pharmaceutical care, and ensuring safe prescribing.",
                        features: [
                            {
                                title: "Verify Prescriptions",
                                desc: "AI-backed clinical data ensures accurate and safe prescription verification."
                            },
                            {
                                title: "Enhance Medication Safety",
                                desc: "Reduce errors and improve patient safety with AI-powered insights."
                            },
                            {
                                title: "Improve Patient Care",
                                desc: "Structured medical insights for better patient outcomes."
                            },
                            {
                                title: "Seamless Integration",
                                desc: "Works effortlessly with your existing pharmacy workflow."
                            }
                        ],
                        whyLove: {
                            heading: "Why Pharmacies Love Fornix AI",
                            items: [
                                "✔ Smarter Dispensing – AI-powered insights for better medication safety",
                                "✔ Faster Decisions – Instant access to patient summaries",
                                "✔ Seamless Integration – Works with your existing pharmacy workflows",
                                "✔ Safe & Reliable – AI-backed clinical data ensures compliance"
                            ]
                        },
                        callToAction: {
                            heading: "Take the First Step Toward AI-Powered Pharmacy Management",
                            description: "Request your demo today and see how Fornix AI can transform your pharmacy.",
                            buttonText: "Request a Demo Now"
                        },
                        backgroundImage: PharmImage.src
                    })
                    break
                case "hospital":
                    setPageContent({
                        title: "Request a Demo on Hospital Management",
                        description:
                            "Transform Your Hospital with AI-Driven Insights. Say goodbye to guesswork and hello to precision! Fornix AI helps you access AI-powered patient summaries and clinical insights, optimizing patient care, improving clinical outcomes, and ensuring safe prescribing.",
                        features: [
                            {
                                title: "AI-Powered Clinical Decision Support",
                                desc: "Leverage AI to make faster, more accurate clinical decisions."
                            },
                            {
                                title: "Real-Time Patient Data Integration",
                                desc: "Access real-time patient data for better decision-making."
                            },
                            {
                                title: "Enhanced Medication Safety",
                                desc: "Reduce medication errors with AI-powered safety checks."
                            },
                            {
                                title: "Seamless EHR Integration",
                                desc: "Integrate effortlessly with your existing EHR systems."
                            }
                        ],
                        whyLove: {
                            heading: "Why Hospitals Love Fornix AI",
                            items: [
                                "✔ Improved Clinical Outcomes – AI-driven insights for better patient care",
                                "✔ Reduced Administrative Burden – Automate repetitive tasks",
                                "✔ Enhanced Patient Safety – AI-powered safety checks",
                                "✔ Streamlined Workflows – Seamless integration with existing systems"
                            ]
                        },
                        callToAction: {
                            heading: "Take the First Step Toward AI-Powered Hospital Management",
                            description: "Request your demo today and see how Rhazes AI can transform your hospital.",
                            buttonText: "Request a Demo Now"
                        },
                        backgroundImage: HosImage.src
                    })
                    break
            }
        }
    }, [slug])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const submitFormData = async (data: typeof formData) => {
        try {
            const url = `${BACKEND_BASE_URL}/email`
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email_type: "demo_request",
                    message: data
                })
            })

            if (!response.ok) {
                throw new Error("Failed to submit the form")
            }

            const result = await response.json()
            console.log("Form submitted successfully:", result)
            alert("Form submitted successfully!")
        } catch (error) {
            console.error("Error submitting form:", error)
            alert("Failed to submit the form. Please try again.")
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log("Demo Request Submitted", formData)
        await submitFormData(formData)
    }

    const scrollToForm = () => {
        console.log("Scrolling to form section...")
        const formSection = document.getElementById("demo-form")
        if (formSection) {
            formSection.scrollIntoView({ behavior: "smooth", block: "start" })
        } else {
            console.error("Form section not found!")
        }
    }

    return (
        <main className="xl:max-w-screen-2xl mx-auto font-['Product_Sans',_sans-serif] bg-gray-50 min-h-screen">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative py-12 md:py-20 px-4 md:px-16 text-center text-white bg-cover bg-center"
                style={{ backgroundImage: `url(${pageContent.backgroundImage})` }}>
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">{pageContent.title}</h1>
                    <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
                        {pageContent.description}
                    </p>
                    <div className="mt-6 md:mt-8 flex justify-center">
                        <PrimaryButton
                            text="Request a Free Demo Today"
                            sx="w-full md:w-auto px-6 md:px-8"
                            handleClick={scrollToForm}
                        />
                    </div>
                </div>
            </section>

            {/* Key Features Section */}
            <section className="py-12 md:py-16 px-4 md:px-16 text-center bg-white">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-gray-800">
                    Why Choose Fornix AI?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
                    {pageContent.features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-4 md:p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-blue-600">
                                {feature.title}
                            </h3>
                            <p className="text-sm md:text-base text-gray-600">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Love Fornix AI Section */}
            <section className="py-12 md:py-16 px-4 md:px-16 text-center bg-gray-100">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                    {pageContent.whyLove.heading}
                </h2>
                <ul className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto text-justify">
                    {pageContent.whyLove.items.map((item, index) => (
                        <li key={index} className="mb-3 md:mb-4">
                            {item}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Call to Action Section */}
            <section
                className="relative py-12 md:py-16 px-4 md:px-16 text-center bg-cover bg-center text-white"
                style={{ backgroundImage: `url(${Step.src})` }}>
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                        {pageContent.callToAction.heading}
                    </h2>
                    <p className="text-base md:text-lg mb-6 md:mb-8">{pageContent.callToAction.description}</p>
                    <div className="flex justify-center">
                        <PrimaryButton
                            text={pageContent.callToAction.buttonText}
                            sx="w-full md:w-auto px-6 md:px-8"
                            handleClick={scrollToForm}
                        />
                    </div>
                </div>
            </section>
            <section id="demo-form" className="h-14" />

            {/* Demo Request Form */}
            <section className="max-w-2xl mx-auto bg-white p-6 md:p-8 shadow-2xl rounded-lg my-12 md:my-16">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center text-gray-800">
                    📋 Demo Request Form
                </h2>
                <p className="text-base md:text-lg mb-6 md:mb-8 text-center text-gray-600">
                    Fill out the form below, and our team will reach out to schedule your demo.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                        {/* Full Name Field */}
                        <div>
                            <label className="text-gray-700 font-semibold">
                                {slug === "pharmacy"
                                    ? "Full Name (Pharmacist/Pharmacy Owner)"
                                    : "Full Name (Hospital Administrator/Manager)"}
                            </label>
                            <Input
                                name="fullName"
                                type="text"
                                placeholder={slug === "pharmacy" ? "Enter your full name" : "Enter your full name"}
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Organization Name Field */}
                        <div>
                            <label className="text-gray-700 font-semibold">
                                {slug === "pharmacy" ? "Pharmacy Name" : "Hospital Name"}
                            </label>
                            <Input
                                name="pharmacyName"
                                type="text"
                                placeholder={
                                    slug === "pharmacy" ? "Enter your pharmacy name" : "Enter your hospital name"
                                }
                                value={formData.pharmacyName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Email Address Field */}
                        <div>
                            <label className="text-gray-700 font-semibold">Email Address</label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Phone Number Field */}
                        <div>
                            <label className="text-gray-700 font-semibold">Phone Number</label>
                            <Input
                                name="phone"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Referral Field */}
                        <div>
                            <label className="text-gray-700 font-semibold">How Did You Hear About Us? (Optional)</label>
                            <Input
                                name="referral"
                                type="text"
                                placeholder="Enter how you heard about us"
                                value={formData.referral}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Additional Notes Field */}
                        <div>
                            <label className="text-gray-700 font-semibold">Additional Notes (Optional)</label>
                            <Textarea
                                name="notes"
                                placeholder="Enter any additional notes"
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center mt-6">
                        <PrimaryButton type="submit" text="Request a Demo Now" sx="w-full md:w-auto px-6 md:px-8" />
                    </div>
                </form>
            </section>

            {/* Footer */}
            <Footer />
        </main>
    )
}

export default RequestDemo

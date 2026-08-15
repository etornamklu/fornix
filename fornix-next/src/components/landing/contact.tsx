"use client"
import React, { useState } from "react"

const Contact = () => {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" })
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
        // Here you can integrate the actual API or handling of the form submission.
    }

    return (
        <div className="py-8 px-4 md:px-6">
            <div className="max-w-md mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-[#334155] mb-4">Get in Touch</h2>
                {submitted ? (
                    <div className="text-sm text-green-500">
                        Thanks for reaching out! We&apos;ll get back to you soon.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your Name"
                            className="border border-gray-300 p-3 rounded-md text-sm"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Your Email"
                            className="border border-gray-300 p-3 rounded-md text-sm"
                            required
                        />
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Your Message"
                            rows={4}
                            className="border border-gray-300 p-3 rounded-md text-sm"
                            required></textarea>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white p-3 rounded-md text-sm hover:bg-blue-400 transition-all">
                            Send Message
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Contact

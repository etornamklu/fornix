"use client"

import React, { useState } from "react"
import {
    Mail,
    Phone,
    Clock,
    Users,
    BookOpen,
    FileText,
    ExternalLink,
    Send,
    CheckCircle,
    X,
    ChevronRight,
    UserPlus,
    CreditCard,
    Building
} from "lucide-react"

export default function HelpCenter() {
    const [activeTab, setActiveTab] = useState("overview")
    const [supportMessage, setSupportMessage] = useState("")
    const [supportEmail, setSupportEmail] = useState("")
    const [supportSubject, setSupportSubject] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [modalContent, setModalContent] = useState("")

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        setIsSubmitting(false)
        setSubmitted(true)
        setSupportMessage("")
        setSupportEmail("")
        setSupportSubject("")

        // Reset submitted state after 3 seconds
        setTimeout(() => setSubmitted(false), 3000)
    }

    const openModal = (content: string) => {
        setModalContent(content)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setModalContent("")
    }

    const contactInfo = [
        {
            title: "Support Email",
            value: "admin@fornixlabs.com",
            icon: Mail,
            description: "Get help via email",
            action: "mailto:admin@fornixlabs.com",
            color: "text-blue-600"
        },
        {
            title: "Call Center",
            value: "+233 20 146 2313",
            icon: Phone,
            description: "Speak with our support team",
            action: "tel:+233201462313",
            color: "text-green-600"
        }
    ]

    const quickActions = [
        {
            title: "User Management Guide",
            icon: Users,
            description: "Learn how to manage users and permissions",
            modalContent: "userManagement"
        },
        {
            title: "Credit System",
            icon: FileText,
            description: "Understand credit allocation and management",
            modalContent: "creditSystem"
        },
        {
            title: "Organization Setup",
            icon: BookOpen,
            description: "Configure your organization settings",
            modalContent: "organizationSetup"
        }
    ]

    const faqs = [
        {
            question: "How do I add new users to my organization?",
            answer: "Go to the Users section in the admin dashboard, click 'Add User', and fill in their details. You can set their role and initial credit allocation."
        },
        {
            question: "How does the credit system work?",
            answer: "Credits are consumed when users perform AI-powered operations. You can allocate credits per user, per role, or use a shared pool system."
        },
        {
            question: "Can I change user roles after creation?",
            answer: "Yes, you can update user roles and permissions from the Users management section. Changes take effect immediately."
        },
        {
            question: "How do I purchase more credits?",
            answer: "Navigate to Credit Management and click 'Purchase Credits'. You can buy credits in predefined packages or contact sales for custom amounts."
        },
        {
            question: "What are the different user roles available?",
            answer: "We support Doctor, Radiologist, Pharmacy, and Admin roles. Each role has specific permissions and access levels."
        }
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
                        <p className="text-gray-600 mt-1">
                            Get support, find answers, and manage your Fornix AI admin account
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Support available 24/7</span>
                    </div>
                </div>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contactInfo.map((contact, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg bg-gray-50`}>
                                <contact.icon className={`w-5 h-5 ${contact.color}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{contact.title}</h3>
                                <p className="text-sm text-gray-600">{contact.description}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className={`font-medium ${contact.color}`}>{contact.value}</p>
                            <a
                                href={contact.action}
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                {contact.title === "Live Chat" ? "Start Chat" : "Contact Now"}
                                <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => openModal(action.modalContent)}
                            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors text-left">
                            <action.icon className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="font-medium text-gray-900">{action.title}</h3>
                                <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Support Message Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Support Message</h2>
                {submitted ? (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span>Your message has been sent! We&apos;ll get back to you within 24 hours.</span>
                    </div>
                ) : (
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={supportEmail}
                                    onChange={e => setSupportEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="your.email@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={supportSubject}
                                    onChange={e => setSupportSubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Brief description of your issue"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                Message
                            </label>
                            <textarea
                                id="message"
                                value={supportMessage}
                                onChange={e => setSupportMessage(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describe your issue or question in detail..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Send Message</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg">
                            <button
                                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                onClick={() => setActiveTab(activeTab === `faq-${index}` ? "" : `faq-${index}`)}>
                                <span className="font-medium text-gray-900">{faq.question}</span>
                                <div
                                    className={`transform transition-transform ${activeTab === `faq-${index}` ? "rotate-180" : ""}`}>
                                    <svg
                                        className="w-5 h-5 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </button>
                            {activeTab === `faq-${index}` && (
                                <div className="px-4 pb-3">
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {modalContent === "userManagement" && "User Management Guide"}
                                {modalContent === "creditSystem" && "Credit System Guide"}
                                {modalContent === "organizationSetup" && "Organization Setup Guide"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {modalContent === "userManagement" && (
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <UserPlus className="w-8 h-8 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">User Management Guide</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">
                                                How to Invite New Users
                                            </h4>
                                            <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                                <li>
                                                    Navigate to the <strong>Users</strong> section in your admin
                                                    dashboard
                                                </li>
                                                <li>
                                                    Click the <strong>&quot;Invite&quot;</strong> button in the
                                                    top-right corner
                                                </li>
                                                <li>
                                                    Fill in the user details:
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>
                                                            <strong>Name:</strong> Enter the user&apos;s full name
                                                            (first and last name required)
                                                        </li>
                                                        <li>
                                                            <strong>Email:</strong> Enter a valid email address
                                                        </li>
                                                        <li>
                                                            <strong>Role:</strong> Select from Doctor, Radiologist, or
                                                            Pharmacy
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    Click <strong>&quot;Add another user&quot;</strong> to invite
                                                    multiple users at once
                                                </li>
                                                <li>
                                                    Click <strong>&quot;Send invites&quot;</strong> to send invitation
                                                    emails
                                                </li>
                                                <li>
                                                    Invited users will receive an email and appear with
                                                    &quot;Pending&quot; status until they accept
                                                </li>
                                            </ol>
                                        </div>

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-green-900 mb-2">
                                                Managing Existing Users
                                            </h4>
                                            <ol className="list-decimal list-inside space-y-2 text-green-800">
                                                <li>View all users in the Users table with their current status</li>
                                                <li>
                                                    Click the <strong>&quot;⋯&quot;</strong> menu next to any user to
                                                    access actions
                                                </li>
                                                <li>
                                                    You can remove users (except Admin/Owner roles) from the
                                                    organization
                                                </li>
                                                <li>
                                                    User roles cannot be changed after creation - contact support if
                                                    needed
                                                </li>
                                                <li>Removed users lose access immediately and cannot be restored</li>
                                            </ol>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-yellow-900 mb-2">Available User Roles</h4>
                                            <ul className="list-disc list-inside space-y-2 text-yellow-800">
                                                <li>
                                                    <strong>Doctor:</strong> Can access patient diagnosis, history
                                                    taking, and medical reports
                                                </li>
                                                <li>
                                                    <strong>Radiologist:</strong> Specialized access to radiology and
                                                    lab test features
                                                </li>
                                                <li>
                                                    <strong>Pharmacy:</strong> Access to pharmacy-related features and
                                                    patient medication management
                                                </li>
                                                <li>
                                                    <strong>Admin/Owner:</strong> Full administrative access (cannot be
                                                    removed)
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalContent === "creditSystem" && (
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <CreditCard className="w-8 h-8 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Credit System Guide</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">
                                                Understanding Credit Usage Types
                                            </h4>
                                            <div className="space-y-3 text-blue-800">
                                                <div>
                                                    <strong>Pool System:</strong> All credits are shared among all users
                                                    in your organization. Users consume credits from a central pool.
                                                </div>
                                                <div>
                                                    <strong>Individual System:</strong> Credits are allocated to
                                                    specific users. Each user has their own credit balance.
                                                </div>
                                                <div>
                                                    <strong>Role-Based System:</strong> Credits are allocated by user
                                                    role (Doctor, Radiologist, Pharmacy). All users of the same role
                                                    share their role&apos;s credit pool.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-green-900 mb-2">Purchasing Credits</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-green-800">
                                                <li>
                                                    Navigate to <strong>Credit Management</strong> in your admin
                                                    dashboard
                                                </li>
                                                <li>
                                                    Click <strong>&quot;Purchase Credits&quot;</strong> button
                                                </li>
                                                <li>
                                                    Select a credit pack:
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>
                                                            <strong>Small Pack:</strong> 50 credits for ¢50
                                                        </li>
                                                        <li>
                                                            <strong>Standard Pack:</strong> 100 credits for ¢100
                                                            (Popular)
                                                        </li>
                                                        <li>
                                                            <strong>Promo Pack:</strong> 200 credits for ¢200
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    Click <strong>&quot;Pay ¢[amount]&quot;</strong> to proceed with
                                                    payment
                                                </li>
                                                <li>Complete payment using the secure payment gateway</li>
                                                <li>Credits are automatically added to your organization pool</li>
                                            </ol>
                                        </div>

                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-purple-900 mb-2">
                                                Credit Allocation (Individual/Role Systems)
                                            </h4>
                                            <ol className="list-decimal list-inside space-y-2 text-purple-800">
                                                <li>
                                                    Go to <strong>Credit Management</strong> and click{" "}
                                                    <strong>&quot;Allocate Credits&quot;</strong>
                                                </li>
                                                <li>
                                                    For Individual System:
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>Allocate credits to specific users</li>
                                                        <li>Each user gets their own credit balance</li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    For Role-Based System:
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>
                                                            Allocate credits to roles (Doctor, Radiologist, Pharmacy)
                                                        </li>
                                                        <li>
                                                            All users of the same role share that role&apos;s credits
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>Set daily credit limits to prevent overuse</li>
                                                <li>Monitor usage through the credit management dashboard</li>
                                            </ol>
                                        </div>

                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-orange-900 mb-2">Credit Consumption</h4>
                                            <ul className="list-disc list-inside space-y-2 text-orange-800">
                                                <li>Credits are consumed when users perform AI-powered operations</li>
                                                <li>
                                                    Each diagnosis, report generation, or AI analysis consumes credits
                                                </li>
                                                <li>Users with insufficient credits cannot perform AI operations</li>
                                                <li>Credit usage is tracked and displayed in real-time</li>
                                                <li>Low credit warnings are shown when credits are running low</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalContent === "organizationSetup" && (
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <Building className="w-8 h-8 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Organization Setup Guide
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">
                                                Creating Your Organization
                                            </h4>
                                            <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                                <li>
                                                    Navigate to <strong>Organizations</strong> in your admin dashboard
                                                </li>
                                                <li>
                                                    Click <strong>&quot;Create Organization&quot;</strong> or go to{" "}
                                                    <strong>&quot;/admin/organizations/create&quot;</strong>
                                                </li>
                                                <li>
                                                    Follow the 5-step setup process:
                                                    <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                                                        <li>
                                                            <strong>Basic Info:</strong> Enter organization name and
                                                            description
                                                        </li>
                                                        <li>
                                                            <strong>Credits:</strong> Configure credit usage type
                                                            (Pool/Individual/Role-based)
                                                        </li>
                                                        <li>
                                                            <strong>Connection Access:</strong> Set patient data access
                                                            permissions
                                                        </li>
                                                        <li>
                                                            <strong>Daily Limits:</strong> Set daily credit consumption
                                                            limits
                                                        </li>
                                                        <li>
                                                            <strong>Review:</strong> Review all settings before creating
                                                        </li>
                                                    </ol>
                                                </li>
                                                <li>
                                                    Click <strong>&quot;Create Organization&quot;</strong> to finalize
                                                    setup
                                                </li>
                                            </ol>
                                        </div>

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-green-900 mb-2">
                                                Organization Configuration Options
                                            </h4>
                                            <div className="space-y-3 text-green-800">
                                                <div>
                                                    <strong>Basic Information:</strong>
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>Organization name (required)</li>
                                                        <li>Description of your organization</li>
                                                        <li>Profile picture upload (optional)</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <strong>Credit Configuration:</strong>
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>
                                                            Choose between Pool, Individual, or Role-based credit
                                                            allocation
                                                        </li>
                                                        <li>Set initial credit amounts for each allocation type</li>
                                                        <li>Configure daily credit limits to prevent overuse</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <strong>Connection Access:</strong>
                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                        <li>Control how users can access patient data</li>
                                                        <li>Set permissions for different user roles</li>
                                                        <li>Configure data sharing between users</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-purple-900 mb-2">Post-Creation Steps</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-purple-800">
                                                <li>
                                                    After successful creation, you&apos;ll be redirected to the
                                                    dashboard
                                                </li>
                                                <li>
                                                    Your organization ID will be automatically linked to your admin
                                                    account
                                                </li>
                                                <li>Start inviting users using the User Management guide</li>
                                                <li>Purchase credits if needed using the Credit System guide</li>
                                                <li>
                                                    Configure additional settings in the Organization management section
                                                </li>
                                            </ol>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                                            <ul className="list-disc list-inside space-y-2 text-yellow-800">
                                                <li>Organization creation is a one-time process</li>
                                                <li>Credit usage type cannot be changed after creation</li>
                                                <li>Daily limits can be modified later in organization settings</li>
                                                <li>Only admins can create and manage organizations</li>
                                                <li>
                                                    Contact support if you need to make changes to core organization
                                                    settings
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

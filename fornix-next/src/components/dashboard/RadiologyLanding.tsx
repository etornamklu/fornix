import React from "react"
import { Stethoscope, FileText, Target, FlaskConical } from "lucide-react"
import { DashboardPath } from "@/utils/types"
import { useRouter } from "next/navigation"

interface IRadiologyLandingPageProps {
    // Add any props you might need
}

const RadiologyLandingPage = ({}: IRadiologyLandingPageProps) => {
    const router = useRouter()

    const features = [
        {
            title: "Radiology Analysis",
            description:
                "Upload and analyze radiology images including X-rays, CT scans, ultrasounds, and ECGs with AI-powered diagnostic assistance and detailed reporting.",
            icon: <Target size={28} className="text-blue-500" />,
            path: DashboardPath.Radiology
        },
        {
            title: "Lab Test Analysis",
            description:
                "Comprehensive laboratory test result interpretation with reference ranges, clinical significance, and actionable insights for patient care.",
            icon: <FlaskConical size={28} className="text-blue-500" />,
            path: DashboardPath.LabTest
        }
    ]

    const handleFeatureClick = (path: string) => {
        // Handle navigation - you can implement your routing logic here
        // console.log(`Navigating to: ${path}`)
        // Example: router.push(path) or window.location.href = path
        router.push(`/dashboard${path}`)
    }

    return (
        <main className="w-full min-h-screen flex flex-col flex-grow items-center justify-center bg-transparent pb-2 sm:pb-4">
            <div className="w-full max-w-screen-sm sm:max-w-3xl mx-auto flex flex-col gap-3 sm:gap-5 px-2 sm:px-3 md:px-5 text-center">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-3 sm:mb-6">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                        Welcome to <span className="text-blue-500">Radiology Suite</span>
                    </h1>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm max-w-xs sm:max-w-lg">
                        Advanced AI-powered radiology and laboratory analysis for enhanced diagnostic accuracy.
                    </p>
                </div>

                {/* Feature Highlights Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full max-w-screen-sm sm:max-w-2xl md:max-w-3xl">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            onClick={() => handleFeatureClick(feature.path)}
                            className="flex flex-col items-center bg-blue-50 p-2 sm:p-4 rounded-lg shadow hover:shadow-md hover:bg-blue-100 cursor-pointer transition-all hover:-translate-y-0.5">
                            <div className="mb-1 sm:mb-2 p-1.5 sm:p-2 bg-white rounded-full shadow-sm">
                                {feature.icon}
                            </div>
                            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-blue-600 mb-1 sm:mb-2 text-center">
                                {feature.title}
                            </h2>
                            <p className="text-gray-700 text-xs sm:text-sm md:text-base text-center leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Additional Info Section */}
                <div className="mt-2 sm:mt-5 p-2 sm:p-4 w-full max-w-screen-sm sm:max-w-2xl md:max-w-3xl">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                            Comprehensive Diagnostic Support
                        </h3>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base text-center">
                        Our AI-powered platform provides detailed analysis and interpretation of medical images and
                        laboratory results, helping healthcare professionals make informed diagnostic decisions with
                        confidence.
                    </p>
                </div>
            </div>
        </main>
    )
}

export default RadiologyLandingPage

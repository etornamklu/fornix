                import React, { useEffect, useState } from "react";
                import { MdCheckCircle, MdClose } from "react-icons/md"; // Import icons

                // Define the props for the toast component
                interface CustomToastProps {
                title: string;
                description: string;
                status: "success" | "error" | "info" | "warning"; // Allow status types for different toast styles
                duration?: number; // Duration the toast should stay visible in milliseconds
                position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"; // Position for larger screens
                }

                // Main toast component
                export const CustomToast: React.FC<CustomToastProps> = ({
                title,
                description,
                status,
                duration = 3000, // Default duration of 3 seconds
                position = "top-right", // Default position
                }) => {
                const [isVisible, setIsVisible] = useState(true); // Track toast visibility

                // Automatically hide the toast after the duration ends
                useEffect(() => {
                    const timer = setTimeout(() => {
                    setIsVisible(false);
                    }, duration);

                    return () => clearTimeout(timer); // Cleanup timer when component unmounts
                }, [duration]);

                // Define icon based on status
                const statusIcon = {
                    success: <MdCheckCircle size={24} className="text-green-500" />,
                    error: (
                    <div className="p-1 bg-red-500 rounded-full">
                        <MdClose size={24} className="text-white" />
                    </div>
                    ), // White icon with light red box and rounded corners
                    info: <MdCheckCircle size={24} className="text-blue-700" />,
                    warning: (
                    <div className="p-1 bg-yellow-300 rounded-full">
                        <MdClose size={24} className="text-white" />
                    </div>
                    ),
                }[status];

                // Define gradient background based on the status
                const gradientBackground = {
                    success: "bg-gradient-to-r from-green-200 to-white",
                    error: "bg-gradient-to-r from-red-200 to-white",
                    info: "bg-gradient-to-r from-blue-200 to-white",
                    warning: "bg-gradient-to-r from-yellow-200 to-white",
                }[status];

                // Define border color based on status
                const borderColor = {
                    success: "border-green-300",
                    error: "border-red-300",
                    info: "border-blue-300",
                    warning: "border-yellow-300",
                }[status];

                // Define position styles for larger screens
                const positionClasses = {
                    "top-right": "md:top-5 md:right-5",
                    "top-left": "md:top-5 md:left-5",
                    "bottom-right": "md:bottom-5 md:right-5",
                    "bottom-left": "md:bottom-5 md:left-5",
                }[position];

                // If not visible, return null to avoid rendering
                if (!isVisible) return null;

                return (
                    <div
                    className={`fixed z-50 p-4 max-w-xs w-full rounded-lg shadow-md text-white border-2 ${borderColor} ${gradientBackground} transition-all duration-500 ease-in-out 
                        top-5 left-1/2 transform -translate-x-1/2 
                        sm:left-auto sm:transform-none sm:${positionClasses}`}
                    >
                    {/* Close button - fixed at the top */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 text-gray-900 text-lg font-bold z-10"
                    >
                        &times;
                    </button>
                    <div className="relative flex items-start">
                        {/* Render the icon */}
                        <div className="flex items-center">
                        {statusIcon}
                        <div className="ml-4">
                            <h4 className="font-bold text-lg text-gray-900">{title}</h4>
                            <p className="text-sm text-gray-700">{description}</p>
                        </div>
                        </div>
                    </div>
                    </div>
                );
                };

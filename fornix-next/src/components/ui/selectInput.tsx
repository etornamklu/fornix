import React, { useState, useEffect, useRef } from "react";

interface ISelectProps {
    options: Array<{ label: string; value: any }>;
    defaultValue: string;
    onSelect: (value: any) => void;
    sx?: string;
}

const CustomSelect = ({
    options = [],
    defaultValue = "Select gender",
    onSelect,
    sx
}: ISelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(defaultValue);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const selectOption = (option: { label: string; value: any }) => {
        setSelectedValue(option.label);
        setIsOpen(false);
        if (onSelect) {
            onSelect(option.value);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={toggleDropdown}
                className={`w-full bg-white  rounded-md p-2.5 h-11 text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none focus:shadow-lg flex justify-between items-center ${sx}`}
            >
                <span>{selectedValue}</span>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform transform ${
                        isOpen ? "rofocus:outline-none focus:ring-2 focus:ring-blue-500tate-180" : "rotate-0"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <ul className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    {options.map((option, index) => (
                        <li
                            key={index}
                            className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                            onClick={() => selectOption(option)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;

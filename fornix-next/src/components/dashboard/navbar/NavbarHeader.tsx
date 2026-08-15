import React from "react"
import { FaCirclePlus } from "react-icons/fa6"

interface NavbarHeaderProps {
    label: string
    onAddNew: () => void
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({ label, onAddNew }) => {
    return (
        <div className="w-full mt-4 2xl:mt-12 flex justify-between items-center">
            <span className="uppercase text-sm 2xl:text-lg text-gray-500">{label}</span>
            <div className={"cursor-pointer"} onClick={onAddNew}>
                <FaCirclePlus size={25} />
            </div>
        </div>
    )
}

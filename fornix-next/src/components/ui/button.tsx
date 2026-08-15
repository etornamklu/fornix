import React from "react";
import Link from "next/link";

interface IButton {
    sx?: string;
    text: string;
    isLoading?: boolean;
    disabled?: boolean;
    noGradient?: boolean;
    handleClick?: (e: any) => void;
    href?: string;
    type?: "button" | "submit";
}

const PrimaryButton = ({ sx = "", text, disabled = false, isLoading = false, handleClick, href = "", type = "button", noGradient = false }: IButton) => {
    const styles = `${sx} h-auto ${disabled || isLoading ? "opacity-50" : "hover:opacity-80"} py-[12px] flex items-center justify-center rounded-[10px] text-white ${
        noGradient ? "" : "blue-gradient"
    }`;
    return (
        <>
            {!href && (
                <button className={styles} type={type} disabled={disabled || isLoading} onClick={(e) => handleClick && handleClick(e)}>
                    {text}
                </button>
            )}
            {href && (
                <Link href={href} className={styles}>
                    {text}
                </Link>
            )}
        </>
    );
};

export default PrimaryButton;
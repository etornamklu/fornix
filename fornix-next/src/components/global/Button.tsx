import {cn} from "@/utils/classname";
import {ButtonProps} from "@/utils/types";

function Button({
                    variant = "primary",
                    size = "sm",
                    type = "button",
                    label = "",
                    onClick,
                    children,
                    className,
                    disabled
                }: ButtonProps) {
    let buttonSize = "px-3 py-2 text-md";

    switch (size) {
        case "sm":
            buttonSize = "px-2 py-1 text-sm";
            break;
        case "md":
            buttonSize = "px-3 py-2 text-md";
            break;
        case "lg":
            buttonSize = "px-4 py-3 text-lg";
            break;
        case "xl":
            buttonSize = "px-5 py-4 text-xl";
            break;
    }

    let buttonVariant = "bg-primary text-white";

    switch (variant) {
        case "primary":
            buttonVariant = "bg-blue-500 text-white";
            break;
        case "secondary":
            buttonVariant = "bg-gray-500 text-white";
            break;
        case "destructive":
            buttonVariant = "bg-red-500 text-white";
            break;
        case "outline":
            buttonVariant = "bg-white text-black outline outline-1";
            break;
        case "link":
            buttonVariant = "bg-transparent text-blue-500 hover:underline";
            break;
        case "ghost":
            buttonVariant = "bg-transparent text-black";
            break;
        case "plain":
            buttonVariant = "bg-[#F5F5F5] text-black";
            break;
    }

    return (
        <button type={type} disabled={disabled} className={cn("rounded-lg", buttonSize, buttonVariant, className)} onClick={onClick}>
            {label}

            {children}
        </button>
    );
}

export default Button;

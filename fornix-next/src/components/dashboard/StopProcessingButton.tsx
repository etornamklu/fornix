"use client";
import * as Toast from "@radix-ui/react-toast";

interface StopProcessingButtonProps {
    isOpen?: boolean;
    onClick?: () => void;
}

const StopProcessingButton = ({
                                  isOpen = false,
                                  onClick,
                              }: StopProcessingButtonProps) => {
    return (
        <Toast.Provider swipeDirection="right">
            <Toast.Root
                className="absolute bottom-2 md:bottom-10 flex w-full text-white justify-center"
                open={isOpen}
                duration={Infinity}
            >
                <Toast.Action
                    className="flex items-center gap-2 shadow-lg px-4 py-2 rounded-xl bg-[#DC2626]"
                    altText="Stop processing"
                    onClick={onClick}
                >
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                    <button className="font-semibold">Stop processing</button>
                </Toast.Action>
            </Toast.Root>
            <Toast.Viewport/>
        </Toast.Provider>
    );
};

export default StopProcessingButton;

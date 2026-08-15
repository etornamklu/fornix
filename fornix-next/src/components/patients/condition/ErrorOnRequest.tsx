import Button from "@/components/global/Button";
import React from "react";

interface Props {
    error: string;
    tryAgain: () => void;
}


const ErrorOnRequest = ({error, tryAgain}: Props) => {
    return (
        <div className="w-full flex flex-col place-items-center">
            <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
            >
                <strong className="font-bold">An error occurred! </strong>
                <span className="block sm:inline">{error}</span>
                <br/>
                <a
                    href="https://fornixLabs.com/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                >
                    Contact support.
                </a>
            </div>

            <Button
                className="py-3 px-6 font-medium"
                onClick={() => {
                    // Try again
                    tryAgain();
                }}>
                <div>Try again</div>
            </Button>
        </div>
    );
};

export default ErrorOnRequest;

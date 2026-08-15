import { CiCircleInfo } from "react-icons/ci";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import { SquircleLoader } from "@/components/ui/loaders/SquircleLoader";
import { findPatientRequest } from "@/services/dashboard/connections.service";
import { CustomToast } from '@/components/ui/CustomToast';

export const PatientCodeInput = ({ setPage }: { setPage: React.Dispatch<SetStateAction<number>> }) => {
    const [code, setCode] = useState("");
    const [inputValid, setInputValid] = useState(false);
    const [findLoading, setFindLoading] = useState(false);
    const [showToast, setShowToast] = useState(false); // State to show toast
    const [toastProps, setToastProps] = useState({ title: "", description: "", status: "" }); 

    const inputRefList = [
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
    ];

    const resetCode = () => {
        inputRefList.forEach((ref) => {
            if (ref.current && ref.current.value) ref.current.value = "";
        });
        inputRefList[0].current?.focus();
        setCode("");
    };

    useEffect(() => {
        if (code.length === inputRefList.length) {
            setInputValid(true);
        } else setInputValid(false);
    }, [code, inputRefList.length]);

    function handleInput(e: React.ChangeEvent, index: number) {
        const input = e.target as HTMLInputElement;
        const previousInput = inputRefList[index - 1];
        const nextInput = inputRefList[index + 1];

        const newCode = [...code];
        if (/^[a-z]+$/.test(input.value)) {
            const uc = input.value.toUpperCase();
            newCode[index] = uc;
            inputRefList[index].current!.value = uc;
        } else {
            newCode[index] = input.value;
        }
        setCode(newCode.join(""));

        if (input.value === "") {
            if (previousInput) {
                previousInput.current!.focus();
            }
        } else if (nextInput) {
            nextInput.current!.select();
        }
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
        e.target.select();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
        const input = e.target as HTMLInputElement;
        const previousInput = inputRefList[index - 1];
        if (e.key === "Backspace" && input.value === "") {
            e.preventDefault();
            setCode((prevCode) => prevCode.slice(0, index) + prevCode.slice(index + 1));
            if (previousInput) {
                previousInput.current!.focus();
            }
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedCode = e.clipboardData.getData("text");
        if (pastedCode.length === 8) {
            setCode(pastedCode);
            inputRefList.forEach((inputRef, index) => {
                inputRef.current!.value = pastedCode.charAt(index);
            });
        }
    };

    const handleFindPatient = async () => {
        setFindLoading(true);
        setShowToast(false); // Reset the toast visibility before the operation starts

        const connResp = await findPatientRequest(code);

        setFindLoading(false);

        if (connResp?.status === 200) {
            window.localStorage.setItem('ipsfp', JSON.stringify(connResp.patient));
            setPage((prev) => prev + 1);

            // // Show success toast
            // setToastProps({
            //     title: "Success",
            //     description: "Patient found successfully!",
            //     status: "success"
            // });
        } else {
            // Show error toast
            setToastProps({
                title: "Error",
                description: "No matching patient identified with the provided ID. Please attempt again.",
                status: "error"
            });
        }
        setShowToast(true); // Show toast after operation completes
    };

    return (
        <div className="w-full lg:w-fit">
            <div className={"w-full flex flex-col justify-center items-center mt-10"}>
                <div className="flex w-full items-center gap-1">
                    <span className="font-semibold text-lg text-gray-800">Enter patient code</span>
                    <div className="relative group">
                        <CiCircleInfo size={20} className="text-gray-600 group-hover:text-gray-950" />
                        <div
                            className="absolute inset-x-0 bottom-0 flex flex-col justify-center items-center invisible
                            group-hover:visible">
                            <div
                                className="p-4 rounded-xl bg-gray-950 w-60 text-white flex flex-col
                                justify-between items-center gap-2">
                                <div className="text-sm font-semibold">Enter patient code</div>
                                <div className="text-sm">Obtain a code from a patient to get access to their data.</div>
                            </div>
                            <div className="clip-triangle bg-gray-950 w-6 h-10" />
                        </div>
                    </div>
                </div>

                <div className="py-4 w-full grid grid-cols-4 lg:flex justify-center items-center gap-4">
                    {inputRefList.map((inputRef, index) => (
                        <div key={index}
                            className="flex justify-center items-center w-16 h-16 lg:w-12 lg:h-12 2xl:w-16 2xl:h-16 bg-white rounded-xl shadow-md">
                            <input
                                type="text"
                                maxLength={1}
                                ref={inputRef}
                                onChange={(e) => handleInput(e, index)}
                                onFocus={handleFocus}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                className={"text-3xl bg-white w-10 2xl:w-14 flex p-1 2xl:p-2 text-center outline-none font-semibold"}
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleFindPatient}
                    className={`flex w-full rounded-xl justify-center items-center 2xl:text-xl h-14 mt-6
                    transition duration-500
                    ${inputValid && !findLoading ? " blue-gradient text-white shadow-xl " : " bg-blue-200 text-gray-100 "}`}>
                    {findLoading ?
                        <SquircleLoader size={30} speed={1.1} stroke={4} color='white' />
                        : <p>Find Patient</p>
                    }
                </button>

                {/* Conditionally render the CustomToast */}
                {showToast && (
                    <CustomToast
                        title={toastProps.title}
                        description={toastProps.description}
                        status={toastProps.status as 'success' | 'error'}
                        duration={3000} // Adjust the duration as needed
                        position="top-right"
                    />
                )}
            </div>
        </div>
    );
};
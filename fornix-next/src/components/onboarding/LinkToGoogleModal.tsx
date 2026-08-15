import React, {useState} from "react";
import {motion} from "framer-motion";
import {GoAlert} from "react-icons/go";
import ReactDOM from "react-dom";
import {deleteGoogleTokenCookie, LinkAccounts} from "@/services/auth/auth.service";
import {useRouter} from "next/navigation";
import {SquircleLoader} from "@/components/ui/loaders/SquircleLoader";

type Response = {
    user?: any;
    error?: string;
}

const LinkToGoogleModal = ({showModal}: { showModal: boolean }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [mountModal, setMountModal] = useState(showModal)
    const router = useRouter()

    const handleLinkAccountWithGoogle = async () => {
        setIsLoading(true);
        //get user's google token
        const tokenResponse = await fetch('/api/auth/googleToken');
        const {token} = await tokenResponse.json();

        const response = await LinkAccounts(token);
        const {user, error} = response as Response

        if (error) {
            console.log('failed to link accounts')
            setMountModal(false)
            router.push('/signin')
        }
        if (user) {
            router.push('/dashboard')
        }
    }

    if (!mountModal) return null

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="absolute top-0 bg-black bg-opacity-40 backdrop-blur-[2px] p-8 shadow-2xl
             h-full w-full opacity-45"/>

            <div className=" w-full h-full absolute top-0 z-50">
                <motion.div
                    className=" z-40 w-full h-full rounded-md flex justify-center items-center"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}>
                    <div
                        className=" w-full max-w-[350px] sm:max-w-[380px] min-w-[350px] p-5 rounded-md bg-white
                            shadow-lg flex flex-col gap-3 box-border">
                        <div className="flex flex-col gap-1 place-items-center">
                            <div
                                className="bg-yellow-100 w-[40px] h-[40px] flex justify-center place-items-center
                                    rounded-full">
                                <GoAlert size={24} className="text-yellow-600"/>
                            </div>

                            <h3 className="text-xl font-bold ">
                                Link your account with Google?
                            </h3>
                        </div>

                        <p className="text-gray-600 my-4">
                            It looks like you already have an account with this email. Would
                            you like to link your Google account to your existing account?
                        </p>

                        <div className="flex gap-5 justify-between">
                            <button
                                type="button"
                                className=" w-full text-rose-400  h-12 rounded-lg  text-lg font-semibold
                                border border-rose-400 hover:text-rose-500 hover:border-rose-500 transition-colors .02
                                ease-linear"
                                onClick={() => {
                                    deleteGoogleTokenCookie()
                                    setMountModal(false)
                                }}>
                                No
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                className={`w-full h-12 rounded-lg bg-blue-600 text-white text-lg font-semibold 
                                flex justify-center items-center  hover:bg-blue-700 transition-colors .02 ease-linear
                                   ${isLoading ? 'cursor-default' : 'cursor-pointer'}`}
                                onClick={() => {
                                    handleLinkAccountWithGoogle();
                                }}
                            >
                                {isLoading ? (
                                    <SquircleLoader
                                        size={29}
                                        speed={1.1}
                                        stroke={4}
                                        color={'white'}
                                    />
                                ) : (
                                    'Yes'
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body,
    );
};

export default LinkToGoogleModal;

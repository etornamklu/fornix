import React, {useEffect, useState} from "react";

import {FcGoogle} from "react-icons/fc";
import {containsLettersAndNumbers} from "@/utils/auth.client";
import {SquircleLoader} from "@/components/ui/loaders/SquircleLoader";

const Security = () => {
    const [newPassword, setNewPassword] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [statusMessage, setStatusMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handlePasswordChange = async () => {
        setIsLoading(false)
        setStatusMessage("")

        if (newPassword.length < 8) {
            setStatusMessage("New password must be at least 8 characters")
            return
        }

        if (!containsLettersAndNumbers(newPassword)) {
            setStatusMessage('New password should contain letters and numbers.')
            return
        }

        if (newPassword === oldPassword) {
            setStatusMessage('New password cannot be the same as current password')
            return
        }

        setIsLoading(true)

        const resp = await fetch('/api/auth/password/change', {
            method: 'POST',
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        })

        switch (resp.status) {
            case 200:
                setStatusMessage('Password changed successfully.')
                setIsLoading(false)
                break
            case 403:
                setStatusMessage('Incorrect current password.')
                setIsLoading(false)
                break
            default:
                setStatusMessage(`Password update failed. ${(await resp.json() as any).detail}`)
                setIsLoading(false)
        }
    }

    return (
        <div className=" h-auto">
            <h3 className="text-3xl font-bold">Security</h3>
            <p className="text-gray-500">
                Your security is important to us. Contact support if you have any security concerns.
            </p>

            <div className="w-full md:w-[70%] mt-8">
                <h4 className='text-2xl font-semibold'>Change Password</h4>
                <p className={`text-lg rounded-lg ${statusMessage && 'p-2'} ${statusMessage.includes('success') ?
                    'text-green-600 bg-green-50' : 'text-rose-700 bg-rose-50'}`}>
                    {statusMessage}
                </p>
                <label htmlFor="" className="block mb-[3px] text-black">
                    Current password
                </label>
                <input
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    type="password"
                    className="rounded-[6px] w-full p-2 focus:outline-0 border-[1px] border-border  bg-input"
                    placeholder="* * *"/>
            </div>

            <div className="w-full md:w-[70%] mt-4">
                <label htmlFor="" className="block mb-[3px] text-black">
                    New password
                </label>
                <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    className="rounded-[6px] w-full p-2 focus:outline-0 border-[1px] border-border  bg-input"
                    placeholder="* * *"/>
            </div>

            <button
                onClick={handlePasswordChange}
                className={`py-2 px-4 bg-blue-500 text-white rounded-lg mt-2 flex justify-center items-center w-64`}>
                {isLoading ? <SquircleLoader
                    size={29}
                    speed={1.1}
                    stroke={4}
                    color={'white'}
                /> : 'Update Password'}
            </button>

            {/*<div className="w-full md:w-[70%] mt-8  pt-4">*/}
            {/*    <h3 className="text-2xl mb-2 font-bold">Social sign in</h3>*/}
            {/*    <div className="w-full bg-white shadow-md p-4 rounded-[5px]">*/}
            {/*        <div className="flex items-center justify-start gap-2 mb-2">*/}
            {/*			<span className="w-6 flex items-center justify-center h-6">*/}
            {/*				<FcGoogle className="text-lg"/>*/}
            {/*			</span>*/}
            {/*            <p className="text-gray-400">Google</p>*/}
            {/*        </div>*/}

            {/*        <p className="text-primary-light">iammensahmichael@gmail.com</p>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    );
};

export default Security;

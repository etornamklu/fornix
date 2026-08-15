'use client'
import LandingNavbar from "@/components/landing/navbar";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function PasswordResetPage({params}: { params: { slug: string } }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetStatus, setResetStatus] = useState('');

    const router = useRouter()

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setResetStatus('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "password": newPassword,
                    "password_reset_token": params.slug
                }),
            });

            if (response.ok && response.status === 200) {
                setResetStatus('Password reset successfully!');
                setTimeout(() => router.push('/auth/signin'), 5000)
            } else if (response.status === 401 || response.status === 404) {
                setResetStatus('Invalid or expired reset link. Request a new link.')
            } else {
                setResetStatus('Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setResetStatus('Failed to reset password');
        }
    };

    return (
        <>
            <LandingNavbar/>

            <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
                        {resetStatus &&
                            <p className={`mt-2 text-lg text-center ${resetStatus.includes('success') ? 'text-green-600' : 'text-red-600'} `}>
                                {resetStatus}
                            </p>}
                    </div>
                    <div className="mt-6 text-center text-sm text-gray-900">
                        <p>Password should be at least 8 characters.</p>
                        <p>Password should contain letters and numbers.</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <input type="hidden" name="remember" defaultValue="true"/>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="new-password" className="sr-only">
                                    New Password
                                </label>
                                <input
                                    id="new-password"
                                    name="new-password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Reset Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
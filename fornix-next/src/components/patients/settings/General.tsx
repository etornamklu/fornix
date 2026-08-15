import React, { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { clearAllDiagnosisData } from "@/services/dashboard/diagnosis.service"
import { logout, updateUserName, deleteAccount } from "@/services/auth/auth.service"
import { FaLock } from "react-icons/fa6"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { authDefault } from "@/utils/types"

const General = ({ auth }: { auth: typeof authDefault }) => {
    const { data: session } = useSession()
    const [newName, setNewName] = useState("")
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isDeletingAccount, setIsDeletingAccount] = useState(false)

    useEffect(() => {
        setNewName(auth.name)
    }, [auth])

    const handleUpdateProfileInfo = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateUserName(newName.trim())
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await logout()
            clearAllDiagnosisData()
            await signOut()
        } catch (error) {
            console.error("Error during logout:", error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handleDeleteAccount = async () => {
        const isGoogleUser = session?.user?.provider === "google"
        const email = prompt("Please enter your email to confirm account deletion:")
        let password = ""

        if (!email) {
            return
        }

        if (!isGoogleUser) {
            password = prompt("Pleasae enter your password") || ""
            if (!password) {
                alert("Password is required to delete your account")
            }
        }

        const confirmation = confirm("Are you sure you want to delete your account? This action cannot be undone.")

        if (!confirmation) return

        setIsDeletingAccount(true)
        try {
            const result = await deleteAccount(email, password)
            if (result?.success) {
                alert("Your account has been deleted successfully.")
                await logout()
                clearAllDiagnosisData()
                await signOut()
            } else {
                alert(`Error: ${result?.message || "Failed to delete your account."}`)
            }
        } catch (error) {
            console.error("Error during account deletion:", error)
        } finally {
            setIsDeletingAccount(false)
        }
    }

    return (
        <div className="p-4">
            <h3 className="text-3xl font-bold mb-4">General</h3>
            <p className="text-gray-500 mb-6">View and edit profile information.</p>

            <h1 className="mt-8 text-gray-500 mb-2">My Profile</h1>
            <form onSubmit={handleUpdateProfileInfo} className="flex flex-col gap-3">
                <div className="w-full md:w-3/5">
                    <label htmlFor="name" className="block mb-2 text-black">
                        Name
                    </label>
                    <input
                        id="name"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-blue-500"
                        placeholder="eg: Michael Mensah"
                    />
                </div>

                <div className="w-full md:w-3/5">
                    <label htmlFor="email" className="flex items-center gap-1 mb-2 text-black">
                        Email <FaLock className="text-gray-400" size={12} />
                    </label>
                    <input
                        id="email"
                        disabled
                        value={auth.email}
                        type="text"
                        className="w-full p-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-md"
                        placeholder="eg. mensahmichael191@gmail.com"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full sm:w-auto md:w-48 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Save Changes
                </button>
            </form>

            <div className="mt-12">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex justify-center items-center w-full md:w-48 gap-2 py-2 px-4 rounded-md 
                        ${isLoggingOut ? "bg-gray-200 text-gray-500" : "bg-red-500 text-white hover:bg-red-600"}`}>
                    {isLoggingOut ? (
                        <>
                            <AiOutlineLoading3Quarters className="animate-spin" size={20} />
                            <span>Logging out...</span>
                        </>
                    ) : (
                        "Logout"
                    )}
                </button>
            </div>

            <div className="mt-12 bg-red-50 p-4 rounded-md">
                <h3 className="font-bold mb-2">Delete Account</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Warning: This action is irreversible. All your data will be permanently deleted.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className={`flex justify-center items-center w-full md:w-auto gap-2 py-2 px-6 rounded-md 
                        ${isDeletingAccount ? "bg-gray-200 text-gray-500" : "bg-red-700 text-white hover:bg-red-800"}`}>
                    {isDeletingAccount ? (
                        <>
                            <AiOutlineLoading3Quarters className="animate-spin" size={20} />
                            <span>Deleting...</span>
                        </>
                    ) : (
                        "Delete Account"
                    )}
                </button>
            </div>
        </div>
    )
}

export default General

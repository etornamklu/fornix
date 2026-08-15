import { useState } from "react"
import { FaClipboard, FaTimes } from "react-icons/fa"
import useAuthStore from "../../../store/AuthStore"
import { MdOutlineCelebration } from "react-icons/md"
import useAuthEffect from "@/utils/hooks/useAuthEffect"

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative rounded-md shadow-md bg-white p-6 w-[30rem] max-w-4/5 ${className}`}>{children}</div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4 flex justify-between items-center">{children}</div>
)

const CardTitle = ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-3xl text-blue-700 font-bold flex items-center gap-2">{children}</h1>
)

const CardContent = ({ children }: { children: React.ReactNode }) => <div className="space-y-4">{children}</div>

export const QuestionnaireCompleteModal = ({ onClose }: { onClose: () => void }) => {
    const [copied, setCopied] = useState(false)
    const { auth, updateAuth } = useAuthStore()
    // useAuthEffect(setAuth)

    const handleCopy = () => {
        navigator.clipboard.writeText(auth.user_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <Card>
                <CardHeader>
                    <CardTitle>
                        Complete! <MdOutlineCelebration size={30} />{" "}
                    </CardTitle>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                        <FaTimes size={20} />
                    </button>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 px-3 py-2 rounded-md">
                        <p>
                            Great job! Your medical history is now complete. To ensure your clinician has all the
                            details needed for your care, share your unique user code with them.
                        </p>
                    </div>

                    <div>
                        <p className="text-xl font-semibold">1. Connect with a doctor 🤝</p>
                        {auth.user_code ? (
                            <>
                                <div className="flex items-center justify-between space-x-2 bg-gray-100 p-2 rounded-md">
                                    <span className="font-mono text-base tracking-widest">{auth.user_code}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="text-sm flex gap-1 items-center text-gray-600 hover:text-gray-800">
                                        <FaClipboard size={16} />
                                        COPY
                                    </button>
                                    {copied && <span className="text-green-600 text-xs">Copied!</span>}
                                </div>
                                <p className="text-sm text-gray-500">
                                    Share this code with your doctor to establish a connection.
                                </p>
                            </>
                        ) : (
                            <>{() => updateAuth()}</>
                        )}
                    </div>
                    <div>
                        <p className="text-xl font-semibold">2. Accept connection request 👀</p>
                        <p className="text-sm text-gray-500">
                            Open the <span className="text-gray-600">Connections</span> tab to view the connection
                            request from the doctor.
                        </p>
                    </div>
                    <div>
                        <p className="text-xl font-semibold">3. That&apos;s it! 🥳</p>
                        <p className="text-sm text-gray-500">
                            The doctor now has access to your data and can begin the diagnosis.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

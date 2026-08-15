import React, { SetStateAction } from "react"
import { motion } from "framer-motion"

import { PatientCodeInput } from "@/components/dashboard/import_patient_summary/PatientCodeInput"

const StartPage = ({ setPage }: { setPage: React.Dispatch<SetStateAction<number>> }) => {
    // anmimating component on mount
    const fadeAnimation = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    return (
        <motion.div
            className="w-full h-full flex flex-col justify-center items-center px-6 lg:px-0"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeAnimation}>
            <div className="flex flex-col justify-center items-center gap-2 2xl:gap-6">
                <div
                    className="flex flex-col lg:flex-row 2xl:flex-col justify-center items-center gap-2 2xl:text-6xl
                        lg:text-3xl text-4xl">
                    <span className="font-bold">Import patient</span>
                    <span className="italic text-blue-500 font-bold">summary</span>
                </div>

                <span className="text-gray-700 text-md 2xl:text-lg text-center">
                    Enter client&apos;s unique code to access structured summaries and receive AI-powered clinical
                    insights.
                </span>
            </div>

            <PatientCodeInput setPage={setPage} />
        </motion.div>
    )
}

export default StartPage

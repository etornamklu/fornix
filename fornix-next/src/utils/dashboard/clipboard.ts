import { ReportData } from "../types"

export const formatReportForClipboard = (reportName: string, reportData: any, getSections: () => string[]): string => {
    let reportText = `${reportName}\n\n`

    const dataToFormat = reportData.content || reportData

    // Loop through sections and add their content
    getSections().forEach(sectionKey => {
        const sectionData = dataToFormat[sectionKey as keyof ReportData]

        if (!sectionData) return

        if (typeof sectionData !== "object" || Array.isArray(sectionData)) {
            // Add extra newlines between sections
            reportText += `${sectionKey.replace(/_/g, " ")}:\n${sectionData}\n\n\n`
            return
        }

        // For nested objects, don't add section header in uppercase - just handle keys individually
        Object.entries(sectionData).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return

            // Format the value based on type
            let formattedValue = ""
            if (Array.isArray(value)) {
                formattedValue = value.join(", ")
            } else if (typeof value === "object") {
                // For objects like instructions_and_follow_up
                formattedValue = "\n" // Start on a new line
                Object.entries(value).forEach(([subKey, subValue]) => {
                    if (!subValue) {
                        formattedValue += `${subKey.replace(/_/g, " ")}: No data available`
                    } else {
                        formattedValue += `${subKey.replace(/_/g, " ")}: ${subValue}`
                    }
                    formattedValue += ", "
                })
                // Remove trailing comma and space
                formattedValue = formattedValue.slice(0, -2)
            } else {
                formattedValue = String(value)
            }

            // For longer text, add a newline after the key
            if (
                typeof formattedValue === "string" &&
                (formattedValue.length > 80 ||
                    key.includes("details") ||
                    key.includes("consent") ||
                    key.includes("description"))
            ) {
                reportText += `${key.replace(/_/g, " ")}:\n${formattedValue}\n\n\n`
            } else {
                reportText += `${key.replace(/_/g, " ")}: ${formattedValue}\n\n\n`
            }
        })
    })

    return reportText.trim()
}

/**
 * Copies text to clipboard with success feedback
 */
export const copyToClipboard = async (
    text: string,
    onSuccess?: () => void,
    onError?: (error: any) => void
): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text)
        onSuccess?.()
        return true
    } catch (error) {
        console.error("Failed to copy to clipboard:", error)
        onError?.(error)
        return false
    }
}

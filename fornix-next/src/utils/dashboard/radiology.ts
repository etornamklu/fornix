import {
    RadiologyReportContent,
    ECGReport,
    XRayReport,
    CTScanReport,
    UltrasoundReport,
    ReportType,
    ParsedRadiologyData
} from "@/utils/types" // Adjust path as needed

// Individual parsing functions for each report type
export const parseECGReport = (reportResponse: string): ECGReport | undefined => {
    try {
        const parsedJson = JSON.parse(reportResponse) as any
        // Validate that it has ECG-specific fields
        if (parsedJson.measurements || parsedJson.findings?.rhythm) {
            return parsedJson as ECGReport
        }
    } catch (error) {
        console.error("Error parsing ECG report:", error)
    }
    return undefined
}

export const parseXRayReport = (reportResponse: string): XRayReport | undefined => {
    try {
        const parsedJson = JSON.parse(reportResponse) as any
        // Validate that it has X-ray specific fields
        if (parsedJson.anatomic_region || parsedJson.projection || parsedJson.findings?.skeletal) {
            return parsedJson as XRayReport
        }
    } catch (error) {
        console.error("Error parsing X-Ray report:", error)
    }
    return undefined
}

export const parseCTScanReport = (reportResponse: string): CTScanReport | undefined => {
    try {
        const parsedJson = JSON.parse(reportResponse) as any
        // Validate that it has CT-specific fields
        if (parsedJson.scan_type || parsedJson.abnormalities) {
            return parsedJson as CTScanReport
        }
    } catch (error) {
        console.error("Error parsing CT Scan report:", error)
    }
    return undefined
}

export const parseUltrasoundReport = (reportResponse: string): UltrasoundReport | undefined => {
    try {
        const parsedJson = JSON.parse(reportResponse) as any
        // Validate that it has ultrasound-specific fields
        if (parsedJson.modality || (parsedJson.findings?.positive_findings && Array.isArray(parsedJson.findings.positive_findings))) {
            return parsedJson as UltrasoundReport
        }
    } catch (error) {
        console.error("Error parsing Ultrasound report:", error)
    }
    return undefined
}

// Main parsing function that routes to appropriate parser based on report type
export const parseRadiologyReport = (
    reportResponse: string,
    reportType?: string
): RadiologyReportContent | ParsedRadiologyData | undefined => {
    // First try to parse as JSON
    let parsedData: any
    try {
        parsedData = JSON.parse(reportResponse)
    } catch (error) {
        console.error("Failed to parse JSON:", error)
        return undefined
    }

    // If we have a specific report type, try type-specific parsing
    if (reportType) {
        switch (reportType.toLowerCase()) {
            case 'ecg':
                return parseECGReport(reportResponse) || parsedData
            case 'xray':
                return parseXRayReport(reportResponse) || parsedData
            case 'ct_scan':
                return parseCTScanReport(reportResponse) || parsedData
            case 'ultrasound':
                return parseUltrasoundReport(reportResponse) || parsedData
            default:
                return parsedData
        }
    }

    // If no specific type, try to determine type from content
    const ecgReport = parseECGReport(reportResponse)
    if (ecgReport) return ecgReport

    const xrayReport = parseXRayReport(reportResponse)
    if (xrayReport) return xrayReport

    const ctReport = parseCTScanReport(reportResponse)
    if (ctReport) return ctReport

    const ultrasoundReport = parseUltrasoundReport(reportResponse)
    if (ultrasoundReport) return ultrasoundReport

    // Fallback to generic parsed data
    return parsedData
}

// Type guards
export const isECGReport = (report: any): report is ECGReport => {
    return report &&
        (report.measurements ||
            (report.findings && report.findings.rhythm))
}

export const isXRayReport = (report: any): report is XRayReport => {
    return report &&
        (report.anatomic_region ||
            report.projection ||
            (report.findings && report.findings.skeletal))
}

export const isCTScanReport = (report: any): report is CTScanReport => {
    return report &&
        (report.scan_type ||
            report.abnormalities)
}

export const isUltrasoundReport = (report: any): report is UltrasoundReport => {
    return report &&
        (report.modality ||
            (report.findings &&
                report.findings.positive_findings &&
                Array.isArray(report.findings.positive_findings)))
}

// Utility function to check if a parsed report is valid
export const isValidRadiologyReport = (report: any): report is RadiologyReportContent => {
    return report &&
        typeof report === 'object' &&
        (isECGReport(report) ||
            isXRayReport(report) ||
            isCTScanReport(report) ||
            isUltrasoundReport(report))
}

// Utility function to determine report type from parsed report
export const getReportType = (report: RadiologyReportContent | ParsedRadiologyData): string => {
    if (isECGReport(report)) return 'ecg'
    if (isXRayReport(report)) return 'xray'
    if (isCTScanReport(report)) return 'ct_scan'
    if (isUltrasoundReport(report)) return 'ultrasound'
    return 'unknown'
}

// Utility function to extract key findings from any radiology report
export const extractKeyFindings = (report: RadiologyReportContent | ParsedRadiologyData): string[] => {
    const findings: string[] = []

    // ECG findings
    if (isECGReport(report)) {
        if (report.findings?.positive_findings) {
            findings.push(...report.findings.positive_findings)
        }
        if (report.diagnosis) {
            findings.push(report.diagnosis)
        }
    }

    // X-Ray findings
    else if (isXRayReport(report)) {
        if (report.impression?.detailed_summary) {
            findings.push(report.impression.detailed_summary)
        }
        if (report.impression?.differential_diagnosis) {
            findings.push(...report.impression.differential_diagnosis)
        }
    }

    // CT Scan findings
    else if (isCTScanReport(report)) {
        if (report.findings?.positive_findings) {
            findings.push(...report.findings.positive_findings)
        }
        if (report.impression) {
            findings.push(report.impression)
        }
    }

    // Ultrasound findings
    else if (isUltrasoundReport(report)) {
        if (report.findings?.positive_findings) {
            report.findings.positive_findings.forEach(finding => {
                if (finding.description) {
                    findings.push(finding.description)
                }
            })
        }
        if (report.impression?.detailed_summary) {
            findings.push(report.impression.detailed_summary)
        }
    }

    // Generic findings extraction for unknown types
    else {
        const reportObj = report as any
        if (reportObj.findings && typeof reportObj.findings === 'object') {
            Object.values(reportObj.findings).forEach(finding => {
                if (typeof finding === 'string' && finding.trim()) {
                    findings.push(finding.trim())
                } else if (Array.isArray(finding)) {
                    findings.push(...finding.filter(f => typeof f === 'string'))
                }
            })
        }
        if (reportObj.impression && typeof reportObj.impression === 'string') {
            findings.push(reportObj.impression)
        }
        if (reportObj.diagnosis && typeof reportObj.diagnosis === 'string') {
            findings.push(reportObj.diagnosis)
        }
    }

    return findings.filter(finding => finding && finding.trim().length > 0)
}

// Utility function to check if report has critical findings
export const hasCriticalFindings = (report: RadiologyReportContent | ParsedRadiologyData): boolean => {
    const criticalKeywords = [
        'urgent', 'critical', 'emergency', 'acute', 'severe',
        'mass', 'tumor', 'malignant', 'fracture', 'hemorrhage',
        'infarct', 'stroke', 'embolism', 'pneumothorax',
        'pulmonary edema', 'myocardial infarction', 'unstable'
    ]

    const findings = extractKeyFindings(report)
    const textToCheck = findings.join(' ').toLowerCase()

    // Also check urgency field for X-ray reports
    if (isXRayReport(report) && report.impression?.urgency) {
        return report.impression.urgency === 'Emergency' || report.impression.urgency === 'Urgent'
    }

    return criticalKeywords.some(keyword => textToCheck.includes(keyword))
}

// Utility function to get a summary of the report
export const getReportSummary = (report: RadiologyReportContent | ParsedRadiologyData): string => {
    if (isECGReport(report)) {
        return report.diagnosis || report.findings?.rhythm || 'ECG analysis completed'
    }

    if (isXRayReport(report)) {
        return report.impression?.detailed_summary || 'X-Ray analysis completed'
    }

    if (isCTScanReport(report)) {
        return report.impression || report.diagnosis || 'CT Scan analysis completed'
    }

    if (isUltrasoundReport(report)) {
        return report.impression?.detailed_summary || report.impression?.diagnosis || 'Ultrasound analysis completed'
    }

    // Generic fallback
    const reportObj = report as any
    return reportObj.diagnosis ||
        reportObj.impression ||
        reportObj.summary ||
        'Radiology analysis completed'
}

// Export utility to format report content for display (simplified version)
export const formatReportForDisplay = (
    report: RadiologyReportContent | ParsedRadiologyData,
    reportType?: string
): string => {
    const type = reportType || getReportType(report)
    let formatted = `${type.toUpperCase()} REPORT\n\n`

    const summary = getReportSummary(report)
    formatted += `SUMMARY: ${summary}\n\n`

    const findings = extractKeyFindings(report)
    if (findings.length > 0) {
        formatted += "KEY FINDINGS:\n"
        findings.forEach(finding => {
            formatted += `• ${finding}\n`
        })
        formatted += "\n"
    }

    const critical = hasCriticalFindings(report)
    if (critical) {
        formatted += "⚠️ CRITICAL FINDINGS DETECTED\n\n"
    }

    return formatted
}
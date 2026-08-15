import React from "react"
import { Report, DischargeSummary as DischargeSummaryData } from "@/utils/types"
import { flattenToString, REPORT_SPECIFIC_SECTIONS } from "@/utils/dashboard/helpers"
import ReportSection from "../ReportSection"
import DischargeSummarySectionEditor from "./DischargeSummarySectionEditor"

interface DischargeSummaryReportProps {
    reportData: Report
    editingSections: Set<string>
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const DischargeSummaryReport: React.FC<DischargeSummaryReportProps> = ({
    reportData,
    editingSections,
    onStartEditing,
    onSave,
    onCancel
}) => {
    if (!reportData) {
        return null
    }

    const content = (reportData.content || reportData) as DischargeSummaryData

    const sectionOrder = REPORT_SPECIFIC_SECTIONS.discharge_summary || []
    const allSectionKeys = sectionOrder.filter(key => content[key as keyof DischargeSummaryData])

    return (
        <>
            {allSectionKeys.map(sectionKey => {
                const isEditing = editingSections.has(sectionKey)
                const sectionData = content[sectionKey as keyof DischargeSummaryData]

                if (isEditing) {
                    return (
                        <DischargeSummarySectionEditor
                            key={`${sectionKey}-editor`}
                            section={sectionKey}
                            initialData={sectionData}
                            onSave={newData => onSave(sectionKey, newData)}
                            onCancel={() => onCancel(sectionKey)}
                        />
                    )
                }

                const flattenedData = flattenToString(sectionData)

                if (!flattenedData && !isEditing) {
                    return null
                }

                return (
                    <ReportSection
                        key={sectionKey}
                        sectionKey={sectionKey}
                        sectionData={flattenedData}
                        isEditing={isEditing}
                        onStartEditing={onStartEditing}
                        onSave={onSave}
                        onCancel={onCancel}
                    />
                )
            })}
        </>
    )
}

export default DischargeSummaryReport

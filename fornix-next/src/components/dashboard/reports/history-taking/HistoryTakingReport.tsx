import React from "react"
import { Report, PatientMedicalNotes } from "@/utils/types"
import { flattenToString, REPORT_SPECIFIC_SECTIONS } from "@/utils/dashboard/helpers"
import ReportSection from "../ReportSection"
import HistoryTakingSectionEditor from "./HistoryTakingSectionEditor"

interface HistoryTakingReportProps {
    reportData: Report
    editingSections: Set<string>
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const HistoryTakingReport: React.FC<HistoryTakingReportProps> = ({
    reportData,
    editingSections,
    onStartEditing,
    onSave,
    onCancel
}) => {
    if (!reportData) {
        return null
    }

    const content = (reportData.content || reportData) as PatientMedicalNotes

    const sectionOrder = REPORT_SPECIFIC_SECTIONS.history_taking || []
    const allSectionKeys = sectionOrder.filter(key => content[key as keyof PatientMedicalNotes])

    return (
        <>
            {allSectionKeys.map(sectionKey => {
                const isEditing = editingSections.has(sectionKey)
                const sectionData = content[sectionKey as keyof PatientMedicalNotes]

                if (isEditing) {
                    return (
                        <HistoryTakingSectionEditor
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

export default HistoryTakingReport

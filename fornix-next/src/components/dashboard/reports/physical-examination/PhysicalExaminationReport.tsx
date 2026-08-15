import React from "react"
import { Report, PhysicalExaminationNote } from "@/utils/types"
import { flattenToString, REPORT_SPECIFIC_SECTIONS } from "@/utils/dashboard/helpers"
import ReportSection from "../ReportSection"
import PhysicalExaminationSectionEditor from "./PhysicalExaminationSectionEditor"

interface PhysicalExaminationReportProps {
    reportData: Report
    editingSections: Set<string>
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const PhysicalExaminationReport: React.FC<PhysicalExaminationReportProps> = ({
    reportData,
    editingSections,
    onStartEditing,
    onSave,
    onCancel
}) => {
    if (!reportData) {
        return null
    }

    // Handles both "nested" and "flat" data shapes to prevent crashes.
    const content = (reportData.content || reportData) as PhysicalExaminationNote

    // Ensures consistent section ordering every time.
    const sectionOrder = REPORT_SPECIFIC_SECTIONS.physical_examination || []
    const allSectionKeys = sectionOrder.filter(key => content[key as keyof PhysicalExaminationNote])

    return (
        <>
            {allSectionKeys.map(sectionKey => {
                const isEditing = editingSections.has(sectionKey)
                const sectionData = content[sectionKey as keyof PhysicalExaminationNote]

                if (isEditing) {
                    return (
                        <PhysicalExaminationSectionEditor
                            key={`${sectionKey}-editor`}
                            section={sectionKey}
                            initialData={sectionData}
                            onSave={newData => onSave(sectionKey, newData)}
                            onCancel={() => onCancel(sectionKey)}
                        />
                    )
                }

                // Uses our corrected flattenToString to display nested data correctly.
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

export default PhysicalExaminationReport

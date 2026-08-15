import React from "react"
import { Report, ProcedureNoteReport as ProcedureNoteData } from "@/utils/types"
import { flattenToString, REPORT_SPECIFIC_SECTIONS } from "@/utils/dashboard/helpers"
import ReportSection from "../ReportSection"
import ProcedureNoteSectionEditor from "./ProcedureNoteSectionEditor"

interface ProcedureNoteReportProps {
    reportData: Report
    editingSections: Set<string>
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const ProcedureNoteReport: React.FC<ProcedureNoteReportProps> = ({
    reportData,
    editingSections,
    onStartEditing,
    onSave,
    onCancel
}) => {
    if (!reportData) {
        return null
    }

    const content = (reportData.content || reportData) as ProcedureNoteData

    const sectionOrder = REPORT_SPECIFIC_SECTIONS.procedure_note || []
    const allSectionKeys = sectionOrder.filter(key => content[key as keyof ProcedureNoteData])

    return (
        <>
            {allSectionKeys.map(sectionKey => {
                const isEditing = editingSections.has(sectionKey)
                const sectionData = content[sectionKey as keyof ProcedureNoteData]

                if (isEditing) {
                    return (
                        <ProcedureNoteSectionEditor
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

export default ProcedureNoteReport

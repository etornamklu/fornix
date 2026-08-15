import React from "react"
import ReportSection from "../ReportSection"
import ProgressNoteSectionEditor from "./ProgressNotesSectionEditor"
import { Report, ProgressNote, Subjective, Objective, Assessment, Plan } from "@/utils/types"
import { flattenToString } from "@/utils/dashboard/helpers"

interface ProgressNoteReportProps {
    reportData: any
    editingSections: Set<string>
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const ProgressNoteReport: React.FC<ProgressNoteReportProps> = ({
    reportData,
    editingSections,
    onStartEditing,
    onSave,
    onCancel
}) => {
    if (!reportData) {
        return null
    }
    const content = (reportData.content || reportData) as ProgressNote
    const sectionOrder = ["subjective", "objective", "assessment", "plan"]
    const allSectionKeys = sectionOrder.filter(key => content[key as keyof ProgressNote])
    const editableObjectSections = ["subjective", "objective", "assessment", "plan"]

    return (
        <>
            {allSectionKeys.map(sectionKey => {
                const isEditing = editingSections.has(sectionKey)

                if (isEditing && editableObjectSections.includes(sectionKey)) {
                    // THE FIX IS HERE: We create a new, correctly typed variable.
                    // This tells TypeScript that inside this block, we are only dealing with these specific object types.
                    const editableData: Subjective | Objective | Assessment | Plan | {} =
                        content[sectionKey as keyof (Subjective | Objective | Assessment | Plan)] || {}

                    return (
                        <ProgressNoteSectionEditor
                            key={`${sectionKey}-editor`}
                            section={sectionKey}
                            // We pass the new, correctly typed variable to the editor.
                            initialData={editableData}
                            onSave={newData => onSave(sectionKey, newData)}
                            onCancel={() => onCancel(sectionKey)}
                        />
                    )
                }

                // The display logic remains the same.
                const sectionObject = content[sectionKey as keyof ProgressNote]
                const flattenedData = flattenToString(sectionObject)
                if (!flattenedData && !isEditing) {
                    // Also hide empty sections if not editing
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

export default ProgressNoteReport

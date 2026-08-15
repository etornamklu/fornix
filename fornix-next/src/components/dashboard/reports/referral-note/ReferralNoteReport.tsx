import React from "react"
import { Report, ReferralNote as ReferralNoteData } from "@/utils/types"
import { flattenToString, REPORT_SPECIFIC_SECTIONS } from "@/utils/dashboard/helpers"
import ReportSection from "../ReportSection"
import ReferralNoteSectionEditor from "./ReferralNoteSectionEditor"

interface ReferralNoteReportProps {
    reportData: Report
    editingSections: Set<string>
    onStartEditing: (section: string) => void
    onSave: (section: string, data: any) => void
    onCancel: (section: string) => void
}

const ReferralNoteReport: React.FC<ReferralNoteReportProps> = ({
    reportData,
    editingSections,
    onStartEditing,
    onSave,
    onCancel
}) => {
    if (!reportData) {
        return null
    }

    const content = (reportData.content || reportData) as ReferralNoteData

    const sectionOrder = REPORT_SPECIFIC_SECTIONS.referral_note || []
    const allSectionKeys = sectionOrder.filter(key => content[key as keyof ReferralNoteData])

    return (
        <>
            {allSectionKeys.map(sectionKey => {
                const isEditing = editingSections.has(sectionKey)
                const sectionData = content[sectionKey as keyof ReferralNoteData]

                if (isEditing) {
                    return (
                        <ReferralNoteSectionEditor
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

export default ReferralNoteReport

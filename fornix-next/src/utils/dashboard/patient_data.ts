import { PatientMedicalNotes } from "@/utils/types"

export const convertNarrativeResponseToJson = (narrativeResponse: string) => {
    let parsedJson = {} as PatientMedicalNotes
    try {
        parsedJson = JSON.parse(narrativeResponse) as PatientMedicalNotes
    } catch (e) {}

    // match 1, group 1
    const namePattern = /name":"(.+?)(?:",|$)/m
    const agePattern = /age":(.+?)(?:,|$)/m
    const occupationPattern = /occupation":"(.+?)(?:",|$)/m
    const genderPattern = /gender":"(.+?)(?:",|$)/m
    const residencePattern = /residence":"(.+?)(?:"}|$)/m
    const chiefPattern = /chief_complaint":"(.+?)(?:",|$)/m
    const hpcPattern = /history_of_present_illness":"(.+?)(?:",|$)/m
    const reviewPattern = /review_of_systems":"(.+?)(?:",|$)/m
    const pastPattern = /past_medical_history":"(.+?)(?:",|$)/m
    const medicationPattern = /medication_history":"(.+?)(?:",|$)/m
    const familyPattern = /family_history":"(.+?)(?:",|$)/m
    const socialPattern = /social_history":"(.+?)(?:"}|$)/m

    // make matches and set the relevant data based on interface here
    const getMatch = (pattern: RegExp): string | undefined => {
        const m = pattern.exec(narrativeResponse)
        return m && m[1] ? m[1].trim() : undefined
    }

    // Helper function to format review of systems
    const formatReviewOfSystems = (reviewText: string | undefined): string | undefined => {
        if (!reviewText) return undefined

        // Common system keywords that should start new lines
        const systemKeywords = [
            "respiratory",
            "cardiovascular",
            "gastrointestinal",
            "genitourinary",
            "urinary",
            "musculoskeletal",
            "neurological",
            "endocrine",
            "hematologic",
            "psychiatric",
            "dermatologic",
            "integumentary",
            "eyes",
            "ears",
            "nose",
            "throat",
            "ent",
            "gynecologic",
            "obstetric",
            "chest",
            "abdominal",
            "cardiac",
            "pulmonary",
            "renal",
            "hepatic",
            "skeletal",
            "nervous"
        ]

        let formatted = reviewText

        // Replace common separators that might be used between systems
        formatted = formatted.replace(/\.\s*([A-Z])/g, ".\n$1")
        formatted = formatted.replace(/;\s*([A-Z])/g, ";\n$1")

        // Add line breaks before system keywords when they appear mid-sentence
        systemKeywords.forEach(keyword => {
            const patterns = [
                new RegExp(`\\b${keyword}\\s*:`, "gi"),
                new RegExp(`\\b${keyword}\\s+system`, "gi"),
                new RegExp(`\\b${keyword}\\s+symptoms`, "gi")
            ]

            patterns.forEach(pattern => {
                formatted = formatted.replace(pattern, match => {
                    // Only add newline if not already at start of line
                    const beforeMatch = formatted.substring(0, formatted.indexOf(match))
                    const lastNewline = beforeMatch.lastIndexOf("\n")
                    const textAfterLastNewline = beforeMatch.substring(lastNewline + 1).trim()

                    if (textAfterLastNewline.length > 0) {
                        return "\n" + match
                    }
                    return match
                })
            })
        })

        // Clean up any double newlines and trim
        formatted = formatted.replace(/\n\s*\n/g, "\n").trim()

        return formatted
    }

    parsedJson.demographics = parsedJson.demographics || {}
    parsedJson.demographics.name = parsedJson.demographics.name || getMatch(namePattern)
    const ageStr = parsedJson.demographics.age?.toString() || getMatch(agePattern)
    parsedJson.demographics.age = parsedJson.demographics.age || (ageStr ? Number(ageStr) : undefined)
    parsedJson.demographics.occupation = parsedJson.demographics.occupation || getMatch(occupationPattern)
    parsedJson.demographics.gender = parsedJson.demographics.gender || getMatch(genderPattern)
    parsedJson.demographics.residence = parsedJson.demographics.residence || getMatch(residencePattern)

    parsedJson.chief_complaint = parsedJson.chief_complaint || getMatch(chiefPattern)
    parsedJson.history_of_present_illness = parsedJson.history_of_present_illness || getMatch(hpcPattern)

    // Apply formatting to review of systems
    const reviewMatch = parsedJson.review_of_systems || getMatch(reviewPattern)
    parsedJson.review_of_systems = formatReviewOfSystems(reviewMatch)

    parsedJson.past_medical_history = parsedJson.past_medical_history || getMatch(pastPattern)
    parsedJson.medication_history_and_allergies =
        parsedJson.medication_history_and_allergies || getMatch(medicationPattern)
    parsedJson.family_history = parsedJson.family_history || getMatch(familyPattern)
    parsedJson.social_history = parsedJson.social_history || getMatch(socialPattern)

    return parsedJson
}

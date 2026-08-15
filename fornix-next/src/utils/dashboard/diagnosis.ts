import {
    Diagnosis,
    EduInfoResponse,
    FollowUpInstruction,
    FollowUpResponse,
    LabResponse,
    MsrMedication,
    MsrResponse,
    NonPharmResponse
} from "@/utils/types"

export const clinicalKeys = [
    // {name: "Investigations & Expected Findings", value: "tests"},
    { name: "Investigations", value: "lab" },
    { name: "Clinical Management", value: "msr" },
    // {name: "Pharmacological Management", value: "drugs"},
    { name: "Non-Pharmacological Management", value: "non_pharm" },
    { name: "Monitoring & Follow-up", value: "follow_up" },
    { name: "Emergency Instructions", value: "emerg" },
    { name: "Patient Education", value: "edu_info" }
]

export const formPartData = [
    {
        heading: "1. Presenting complaint and duration",
        placeholder: "Eg. Progressive shortness of breath on exertion for the past 2 weeks"
    },
    {
        heading: "2. HPC and Associated Symptoms",
        placeholder:
            "Eg. A gradual onset of dyspnoea on exertion, initially with strenuous activities such as climbing stairs, but now occurring with minimal exertion such as walking on flat ground. Patient also reports orthopnoea, needing to sleep..."
    },
    {
        heading: "3. Past Medical/Surgical & Drug History",
        placeholder:
            "Eg. Hypertension diagnosed 5 years ago, coronary artery disease with a previous myocardial infarction 3 years ago, and atrial fibrillation. Patient is on a regimen of lisinopril, carvedilol, furosemide, warfarin, and aspirin..."
    },
    {
        heading: "4. Social History & Family History",
        placeholder:
            "Eg. a sedentary lifestyle due to limited mobility from chronic illness. Patient reports occasional alcohol consumption, with average intake of two drinks per week. Patient has a history of smoking, with a 10-pack-year smoking..."
    },
    {
        heading: "5. Clinical Findings, Investigations and others",
        placeholder:
            "Eg. On examination, patient appears dyspneic at rest with increased work of breathing. Vital signs show elevated heart rate and blood pressure with jugular venous distention. Lung auscultation reveals bibasilar crackles..."
    }
]

export const removeAsterisks = (inString: string) => {
    return inString.replace(/\*/g, " ")
}

export const diagnosisCompletionResponseToJson = (responseString: string) => {
    // responseString = removeAsterisks(responseString)
    let diagnosis: Diagnosis = {} as Diagnosis
    // console.log(responseString)

    try {
        // parse response as json
        diagnosis = JSON.parse(responseString) as Diagnosis
        return diagnosis
    } catch (err) {
        // error, presumably in parsing, use regex
        // console.log('using regex')
    }

    // match 1, group 1
    const diffDiagConditionPattern = /{"differential_diagnosis":{"condition":"([^"]+)/is
    // match 1, group 1
    const diffDiagReasoningPattern = /{"differential_diagnosis":{"condition":".+?","reasoning":"([^"]+)/is
    // match 1, group 1, matches entire array in one
    const altDiagArrayPattern = /"alternative_diagnoses":(.+)/is
    // match x, group 1
    const altDiagItemPattern = /"condition":"(.+?)","possible":(.+?),"explanation":"(.+?)(?:"|$)/gis

    const diffDiagConditionMatch = responseString.match(diffDiagConditionPattern)
    const diffDiagReasoningMatch = responseString.match(diffDiagReasoningPattern)
    const altDiagArrayMatch = responseString.match(altDiagArrayPattern)

    if (altDiagArrayMatch) {
        const altDiagItemMatch = altDiagArrayMatch[1].matchAll(altDiagItemPattern)
        diagnosis.alternative_diagnoses = [...altDiagItemMatch].map((item, index) => ({
            condition: item[1] ?? "",
            possible: item[2] ?? "",
            explanation: item[3] ?? ""
        }))
    }

    diagnosis.differential_diagnosis = {
        condition: diffDiagConditionMatch ? diffDiagConditionMatch[1] : "",
        reasoning: diffDiagReasoningMatch ? diffDiagReasoningMatch[1] : ""
    }

    // console.log(diagnosis)
    return diagnosis
}

export const summaryResponseToJson = (summary: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(summary)
        if (parsedJson && typeof parsedJson === "object" && "summary" in parsedJson) {
            return parsedJson.summary
        }
    } catch (e) {
        const summaryPattern = /{"summary":"([^"]+)/is
        const summaryMatch = summary.match(summaryPattern)
        if (summaryMatch && summaryMatch[1]) return summaryMatch[1]
    }

    return null
}

export const msrResponseToJson = (msrResponse: string) => {
    let parsedJson: MsrResponse
    try {
        // first try real JSON
        parsedJson = JSON.parse(msrResponse) as MsrResponse
        return parsedJson
    } catch {
        // fallback to regex
    }

    const msrJson = {} as MsrResponse

    // 1) initial_management
    const initialPattern = /"initial_management"\s*:\s*"([^"]*)"/is
    const initialMatch = initialPattern.exec(msrResponse)
    msrJson.initial_management = initialMatch ? initialMatch[1] : ""

    // 2) medications (with optional adverse_effects)
    const medPattern =
        /"drug_name"\s*:\s*"(.+?)"\s*,\s*"dose"\s*:\s*"(.+?)"\s*,\s*"rationale"\s*:\s*"(.+?)"(?:\s*,\s*"adverse_effects"\s*:\s*\[([\s\S]*?)\])?/gis
    const meds: MsrMedication[] = []
    for (const m of msrResponse.matchAll(medPattern)) {
        const [, drug_name, dose, rationale, rawAdverse] = m
        let adverse_effects: string[] | undefined
        if (rawAdverse) {
            // split out each quoted item in the array
            adverse_effects = [...rawAdverse.matchAll(/"([^"]+)"/g)].map(a => a[1])
        }
        meds.push({ drug_name, dose, rationale, ...(adverse_effects && { adverse_effects }) })
    }
    msrJson.medications = meds

    // 3) surgical_intervention
    const surgPattern =
        /"surgical_intervention"\s*:\s*\{\s*"procedure"\s*:\s*"([^"]+)"\s*,\s*"rationale"\s*:\s*"([^"]+)"\s*\}/is
    const surgMatch = surgPattern.exec(msrResponse)
    msrJson.surgical_intervention = surgMatch
        ? { procedure: surgMatch[1], rationale: surgMatch[2] }
        : { procedure: "", rationale: "" }

    // 4) psychological_intervention
    const psychPattern =
        /"psychological_intervention"\s*:\s*\{\s*"psychotherapy"\s*:\s*\[([^\]]*)\]\s*,\s*"behavioral_interventions"\s*:\s*\[([^\]]*)\]\s*,\s*"rationale"\s*:\s*"([^"]+)"\s*\}/is
    const psychMatch = psychPattern.exec(msrResponse)
    if (psychMatch) {
        const [, rawPsy, rawBeh, psyRationale] = psychMatch
        const psychotherapy = [...rawPsy.matchAll(/"([^"]+)"/g)].map(x => x[1])
        const behavioral_interventions = [...rawBeh.matchAll(/"([^"]+)"/g)].map(x => x[1])
        msrJson.psychological_intervention = { psychotherapy, behavioral_interventions, rationale: psyRationale }
    } else {
        msrJson.psychological_intervention = { psychotherapy: [], behavioral_interventions: [], rationale: "" }
    }

    // 5) additional_notes
    const addNotesPattern = /"additional_notes"\s*:\s*"([^"]*)"/is
    const addNotesMatch = addNotesPattern.exec(msrResponse)
    msrJson.additional_notes = addNotesMatch ? addNotesMatch[1] : ""

    return msrJson
}

export const labResponseToJson = (labResponse: string) => {
    let parsedJson
    const labJson = {} as LabResponse

    try {
        parsedJson = JSON.parse(labResponse) as LabResponse
        return parsedJson
    } catch (e) {}

    // match x, groups 3+1
    const fltPattern =
        /"name":"(.+?)","rationale":"(.+?)","expected_findings":"(.+?)"(?:,"critical_values":"(.+?)")?/gis
    // match 1, group 1
    const addTestsArrayPattern = /"additional_tests":\[(.+?)]/is
    // match x, groups 3
    const addTestsItemsPattern = /"name":"(.+?)","when_to_order":"(.+?)","expected_findings":"(.+?)"/gis
    // match x, groups 3
    const imagingStudiesPattern = /"type":"(.+?)","area_of_focus":"(.+?)","expected_findings":"(.+?)"/gis
    // match x, groups 2
    const specConPattern = /"specialty":"(.+?)","rationale":"(.+?)"/gis
    // match 1, group 1
    const diagPitfallsArrayPattern = /"diagnostic_pitfalls":\[(.+?)]/gis
    // match x, group 1
    const diagPitFallsItemsPattern = /"([^"]+)/gis
    // match 1, group 1
    const redFlagsArrayPattern = /"red_flags":\[(.+?)]/gis
    // match x, group 1
    const redFlagsItemsPattern = /"([^"]+)/gis

    const fltMatch = labResponse.matchAll(fltPattern)
    labJson.first_line_tests = [...fltMatch].map(item => ({
        name: item[1] ?? "",
        rationale: item[2] ?? "",
        expected_findings: item[3] ?? "",
        critical_values: item[4] ?? ""
    }))

    const addTestsArrayMatch = labResponse.match(addTestsArrayPattern)
    if (addTestsArrayMatch && addTestsArrayMatch[1]) {
        const addTestsItemsMatch = addTestsArrayMatch[1].matchAll(addTestsItemsPattern)
        labJson.additional_tests = [...addTestsItemsMatch].map(item => ({
            name: item[1] ?? "",
            when_to_order: item[2] ?? "",
            expected_findings: item[3] ?? ""
        }))
    }

    const imagingStudiesMatch = labResponse.matchAll(imagingStudiesPattern)
    labJson.imaging_studies = [...imagingStudiesMatch].map(item => ({
        type: item[1] ?? "",
        area_of_focus: item[2] ?? "",
        expected_findings: item[3] ?? ""
    }))

    const specConMatch = labResponse.matchAll(specConPattern)
    labJson.specialist_consultations = [...specConMatch].map(item => ({
        specialty: item[1] ?? "",
        rationale: item[2] ?? ""
    }))

    const diagPitfallsArrayMatch = labResponse.match(diagPitfallsArrayPattern)
    if (diagPitfallsArrayMatch && diagPitfallsArrayMatch[1]) {
        const diagPitfallsItemsMatch = diagPitfallsArrayMatch[1].matchAll(diagPitFallsItemsPattern)
        labJson.diagnostic_pitfalls = [...diagPitfallsItemsMatch].map(item => item[1] ?? "")
    }

    const redFlagsArrayMatch = labResponse.match(redFlagsArrayPattern)
    if (redFlagsArrayMatch && redFlagsArrayMatch[1]) {
        const redFlagsItemsMatch = redFlagsArrayMatch[1].matchAll(redFlagsItemsPattern)
        labJson.red_flags = [...redFlagsItemsMatch].map(item => item[1] ?? "")
    }

    return labJson
}

export const eduResponseToJson = (eduResponse: string) => {
    let parsedJson
    const eduJson = {} as EduInfoResponse
    try {
        parsedJson = JSON.parse(eduResponse) as EduInfoResponse
        return parsedJson
    } catch (e) {
        // bad json, use regex
    }

    // match x, group 1
    const eduInfoPattern = /(?:{"education_points":\[)?"(.+?)"/gis
    const eduInfoItems = eduResponse.matchAll(eduInfoPattern)
    eduJson.education_points = [...eduInfoItems].map(item => item[1] ?? "")

    return eduJson
}

export const followUpResponseToJson = (followUpResponse: string) => {
    let parsedJson
    const followUpJson = {} as FollowUpResponse
    try {
        parsedJson = JSON.parse(followUpResponse) as EduInfoResponse
        return parsedJson
    } catch (e) {
        // bad json, use regex
    }

    const followUpItemsPattern =
        /"instruction_number":(\d+),"category":"(.+?)","action":"(.+?)","timeframe":"(.+?)","clinical_rationale":"(.+?)"/gm

    let match
    const instArr: FollowUpInstruction[] = []
    while ((match = followUpItemsPattern.exec(followUpResponse)) !== null) {
        const instruction: FollowUpInstruction = {
            instruction_number: parseInt(match[1] ?? 1),
            category: match[2] ?? "",
            action: match[3] ?? "",
            timeframe: match[4] ?? "",
            clinical_rationale: match[5] ?? ""
        }
        instArr.push(instruction)
    }

    followUpJson.follow_up_instructions = instArr

    // console.log(followUpJson)
    return followUpJson
}

export const nonPharmResponseToJson = (nonPharmResponse: string) => {
    let parsedJson
    const nonPharmJson = {} as NonPharmResponse
    try {
        parsedJson = JSON.parse(nonPharmResponse) as NonPharmResponse
        return parsedJson
    } catch (e) {
        // bad json, use regex
    }

    // match 1, group 1
    const proceduralItemsArrayPattern = /"procedural_physical_interventions"\s*:\s*\[(.+?)?(?:]|$)/is
    const supportiveItemsArrayPattern = /"supportive_device_based_therapies"\s*:\s*\[(.+?)?(?:]|$)/is
    const behavioralItemsArrayPattern = /"behavioral_lifestyle_modifications"\s*:\s*\[(.+?)?(?:]|$)/is
    const psychoItemsPattern = /"psychosocial_support"\s*:\s*\[(.+?)?(?:]|$)/is
    // match x, group 1
    const stringItemPattern = /"(.+?)(?:"|$)/g

    const proceduralItemsArrayMatch = nonPharmResponse.match(proceduralItemsArrayPattern)
    if (proceduralItemsArrayMatch && proceduralItemsArrayMatch[1]) {
        const proceduralItemsMatch = proceduralItemsArrayMatch[1].matchAll(stringItemPattern)
        nonPharmJson.procedural_physical_interventions = [...proceduralItemsMatch].map(item => item[1] ?? "")
    }

    const supportiveItemsArrayMatch = nonPharmResponse.match(supportiveItemsArrayPattern)
    if (supportiveItemsArrayMatch && supportiveItemsArrayMatch[1]) {
        const supportiveItemsMatch = supportiveItemsArrayMatch[1].matchAll(stringItemPattern)
        nonPharmJson.supportive_device_based_therapies = [...supportiveItemsMatch].map(item => item[1] ?? "")
    }

    const behavioralItemsArrayMatch = nonPharmResponse.match(behavioralItemsArrayPattern)
    if (behavioralItemsArrayMatch && behavioralItemsArrayMatch[1]) {
        const behavioralItemsMatch = behavioralItemsArrayMatch[1].matchAll(stringItemPattern)
        nonPharmJson.behavioral_lifestyle_modifications = [...behavioralItemsMatch].map(item => item[1] ?? "")
    }

    const psychoItemsArrayMatch = nonPharmResponse.match(psychoItemsPattern)
    if (psychoItemsArrayMatch && psychoItemsArrayMatch[1]) {
        const psychoItemsMatch = psychoItemsArrayMatch[1].matchAll(stringItemPattern)
        nonPharmJson.psychosocial_support = [...psychoItemsMatch].map(item => item[1] ?? "")
    }

    return nonPharmJson
}

export const clinicalResponseToJson = (response: string, clinicalKey: string) => {
    // clinical key represents the key used in the clinical request e.g. tests
    // console.log(response)
    response = removeAsterisks(response)
    let pattern = RegExp.prototype
    const result: (string | { key: string; value: string })[] = []

    switch (clinicalKey) {
        case "tests":
            pattern = /\d+\. +(.+?):\n?-* *\n* ?\n? +?-* *(?:Expected findings)?: *(.+?)(?=\d+\.|$)/gis
            break
        case "drugs":
            pattern = /\d+\. +(.+?)-* *\n* ?[-:]\n? +?(.+?)(?=\d+\. |$|`|\n)/gis
            break
        case "follow_up":
            return followUpResponseToJson(response)
        case "msr":
            return msrResponseToJson(response)
        case "lab":
            return labResponseToJson(response)
        case "non_pharm":
            return nonPharmResponseToJson(response)
        case "emerg":
            pattern = /(?:{"instruction":\[)?"(.+?)"/gis
            break
        case "edu_info":
            pattern = /(?:{"education_points":\[)?"(.+?)"/gis
            break
    }

    const matches = response.matchAll(pattern)

    for (const match of matches)
        result.push(
            ["tests", "drugs", "follow_up"].includes(clinicalKey)
                ? {
                      key: match[1].trim(),
                      value: match[2].trim()
                  }
                : match[1]
        )

    // console.log(result)
    return result
}

export const convertNewlineToBreak = (inString: string) => {
    return inString.replace(/\n/g, "<br/>")
}

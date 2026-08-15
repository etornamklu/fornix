import {
    AdmissionNote,
    DeathNote,
    DischargeSummary,
    OperativeNote,
    PhysicalExamination,
    ProcedureNote,
    ProgressNote,
    ReferralNote,
    ReportType
} from "@/utils/types"

export const parsePhysicalExam = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as PhysicalExamination
        return parsedJson
    } catch (error) {
        // parse failed, do nothing
    }
}

export const parseProgressNote = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as ProgressNote
        return parsedJson
    } catch (error) {
        // parse failed, do nothing
    }
}

export const parseOperativeNote = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as OperativeNote
        return parsedJson
    } catch (error) {}
}

export const parseAdmissionNote = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as AdmissionNote
        return parsedJson
    } catch (error) {}
}

export const parseProcedureNote = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as ProcedureNote
        return parsedJson
    } catch (error) {}
}

export const parseDeathNote = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as DeathNote
        return parsedJson
    } catch (error) {}
}

export const parseReferralNote = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as ReferralNote
        return parsedJson
    } catch (error) {}
}

export const parseDischargeSummary = (reportResponse: string) => {
    let parsedJson
    try {
        parsedJson = JSON.parse(reportResponse) as DischargeSummary
        return parsedJson
    } catch (error) {}
}

export const parseReport = (reportResponse: string, reportType: ReportType) => {
    // this function takes report data (complete & incomplete) and parses to json
    // it calls the smaller parse functions

    switch (reportType) {
        case ReportType.PhysicalExamination:
            return parsePhysicalExam(reportResponse)
        case ReportType.AdmissionNote:
            return parseAdmissionNote(reportResponse)
        case ReportType.ProcedureNote:
            return parseProcedureNote(reportResponse)
        case ReportType.DeathNote:
            return parseDeathNote(reportResponse)
        case ReportType.DischargeSummary:
            return parseDischargeSummary(reportResponse)
        case ReportType.ReferralNote:
            return parseReferralNote(reportResponse)
        case ReportType.OperativeNote:
            return parseOperativeNote(reportResponse)
        case ReportType.ProgressNote:
            return parseProgressNote(reportResponse)
    }
}

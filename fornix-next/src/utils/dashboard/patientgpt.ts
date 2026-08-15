import { PatientsGptResponse, PatientMedFindMessage } from "@/utils/types"
import { convertNewlineToBreak, removeAsterisks } from "@/utils/dashboard/diagnosis"

export const patientgptResponseToJson = (responseString: string): PatientsGptResponse | string => {
    // the response is expected to be in json of type DoctorGptResponse
    // the response is to be streamed until the json can be properly parsed.
    // until the full response is ready, it will be matched by good ol' regex

    let patientGptResponse
    try {
        patientGptResponse = JSON.parse(responseString) as PatientsGptResponse
        if (patientGptResponse.response) {
            return patientGptResponse
        }
    } catch (e) {}

    const responseRegex = /"response": ?"(.+?)(?:","|$)/is
    const match = responseString.match(responseRegex)

    if (match && match[1]) return match[1]

    return ""
}

export const patienttempConvertChatMessageToStd = (chatMessage: PatientMedFindMessage) => {
    return {
        response: chatMessage.content,
        source_links: Array.isArray(chatMessage?.data?.response_metadata?.links)
            ? chatMessage.data.response_metadata.links.map(link => ({
                  url: link.url,
                  description: link.description
              }))
            : []
    } as PatientsGptResponse
}

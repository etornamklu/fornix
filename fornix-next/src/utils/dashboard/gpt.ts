import { DoctorGptResponse, MedFindMessage } from "@/utils/types"
import { convertNewlineToBreak, removeAsterisks } from "@/utils/dashboard/diagnosis"

export const gptResponseToJson = (responseString: string): DoctorGptResponse | string => {
    // the response is expected to be in json of type DoctorGptResponse
    // the response is to be streamed until the json can be properly parsed.
    // until the full response is ready, it will be matched by good ol' regex

    let docGptResponse
    try {
        docGptResponse = JSON.parse(responseString) as DoctorGptResponse
        if (docGptResponse.response) {
            return docGptResponse
        }
    } catch (e) {}

    const responseRegex = /"response": ?"(.+?)(?:","|$)/is
    const match = responseString.match(responseRegex)

    if (match && match[1]) return match[1]

    return ""
}

export const tempConvertChatMessageToStd = (chatMessage: MedFindMessage) => {
    return {
        response: chatMessage.data.content,
        source_links: Array.isArray(chatMessage?.data?.response_metadata?.links)
            ? chatMessage.data.response_metadata.links.map(link => ({
                  url: link.url,
                  description: link.description
              }))
            : []
    } as DoctorGptResponse
}

import Markdown from "react-markdown"
import { useEffect, useState } from "react"
import { marked } from "marked"
import { renderToStaticMarkup } from "react-dom/server"
import { DoctorGptResponse, PatientsGptResponse } from "@/utils/types"

export const AddLineBreak = ({ text }: { text: DoctorGptResponse | PatientsGptResponse | string }) => {
    const [htmlContent, setHtmlContent] = useState("")

    useEffect(() => {
        if (typeof text !== "string") return

        const updateHtml = async () => {
            const modifiedText = text.replace(/\\n/g, "<br/>")
            // Await the promise to get a string value
            const html = await marked(modifiedText)
            const markdownElement = <Markdown>{modifiedText}</Markdown>
            const htmlString = renderToStaticMarkup(markdownElement)
            setHtmlContent(html)
        }

        updateHtml()
    }, [text])

    return (
        <div>
            {typeof text !== "string" ? (
                text.response.split("\n\n").map((line, index) => {
                    return (
                        <div key={index}>
                            <Markdown>{line}</Markdown>
                            <br />
                        </div>
                    )
                })
            ) : (
                <div
                    // style={{ whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            )}
        </div>
    )
}

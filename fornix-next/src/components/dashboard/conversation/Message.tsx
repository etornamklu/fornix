import React from "react"

const Message = ({ sender, text, index }: { sender: string; text: string; index: number }) => {
    const paragraphCount = index + 1

    return (
        <p className={`my-2`}>
            <strong className="capitalize">{sender}:</strong> {text}
        </p>
    )
}

export default Message

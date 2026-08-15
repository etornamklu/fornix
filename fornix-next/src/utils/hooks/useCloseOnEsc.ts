import { useEffect } from "react"

const useCloseOnEsc = (onClose: () => void) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        document.addEventListener("keydown", handleEsc)

        return () => {
            document.removeEventListener("keydown", handleEsc)
        }
    }, [onClose])
}

export default useCloseOnEsc

import { useEffect } from "react"

/**
 * Hook that closes a modal when clicked outside of it
 * @param ref Ref to the modal element
 * @param onClose Function to call when clicked outside
 */

function useCloseModalOnOutsideClicked(ref: React.RefObject<HTMLElement>, onClose: () => void) {
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose()
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [ref, onClose])
}

export default useCloseModalOnOutsideClicked

import {signOut} from "next-auth/react";

export const useResponseAuth = () => {
    return async () => {
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        localStorage.clear()

        signOut()
    }
}

export function containsLettersAndNumbers(pass: string): boolean {
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /\d/.test(pass);

    return hasLetters && hasNumbers
}
"use client";

export function SignInButton() {
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                // await signIn("google", {redirect: false});
            }}>
            <button type="submit">Signin with Google</button>
        </form>
    );
}

"use client";

// import {useFetchLoggedInUserRequestQuery} from "@/requests/auth.api";
import {useRouter, useSearchParams} from "next/navigation";
import React, {ReactNode, useEffect} from "react";

const ProtectedRoute = ({children}: { children: ReactNode }) => {
    // const {data: user, isLoading, error} = useFetchLoggedInUserRequestQuery();
    const router = useRouter();

  /*  useEffect(() => {
        if (error) {
            router.replace("/");
            return;
        }
    }, [error, router]);*/

    return (
        <div>
            {/*{isLoading && <>Loading...</>}*/}
            {/*/!* Check if user is logged in and doesn't have a role of user *!/*/}
            {/*{!isLoading && user?.user && user?.user?.role !== "user" && user.user.logged_in && <>{children}</>}*/}
        </div>
    );
};

export const RouteToDashboardWhenLoggedIn = ({children}: { children: ReactNode }) => {
    // const {data: user, isLoading, error} = useFetchLoggedInUserRequestQuery();
    const router = useRouter();

    // useEffect(() => {
    //     // Redirect to dashboard if user is logged in
    //     if (user && user.user.logged_in && user.user.role !== "user") {
    //         router.replace("/dashboard");
    //         return;
    //     }
    // }, [user, router]);

    return (
        <div>
            {/*{isLoading && <>Loading...</>}*/}
            {/*/!* Allow user to be on the page if they haven't set their role or their credits  *!/*/}
            {/*{!isLoading && (!user?.user || user?.user?.role === "user") && <>{children}</>}*/}
        </div>
    );
};

export const ProfileSetupProtection = ({children}: { children: ReactNode }) => {
    // const {data: user, isLoading, error} = useFetchLoggedInUserRequestQuery();
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token");

   /* useEffect(() => {
        // Prevent any redirect if isLoading .
        // This is to prevent the page from redirecting to the homepage before user is set
        if (isLoading) return;

        // Redirect logged in user to dashboard
        if (user && user?.user?.role !== "user") {
            router.replace("/dashboard");
            return;
        }

        // Redirect to homepage if param is not set
        if (!token) {
            router.replace("/");
        }
    }, [user, router, token, isLoading]);*/

    return (
        <div>
            {/*{isLoading && <>Loading...</>}*/}
            {/*/!* Allow user to be on the page if they haven't set their role or their credits  *!/*/}
            {/*{!isLoading && (!user?.user || user?.user?.role === "user") && <>{children}</>}*/}
        </div>
    );
};
export default ProtectedRoute;

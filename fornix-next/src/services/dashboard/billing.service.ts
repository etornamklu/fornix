        import { BACKEND_BASE_URL } from "@/utils/constants";
        import { getBearerToken } from "@/utils/auth.server";

        export const fetchBillingHistory = async () => {
            const url = `${BACKEND_BASE_URL}/billing/history`;
            const bearerToken = await getBearerToken();
            console.log("Bearer Token:", bearerToken);

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${bearerToken}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("Unauthorized access. Please log in again.");
                    }
                    throw new Error(
                        `Failed to fetch billing history. Status: ${response.status}`
                    );
                }

                const data = await response.json();
                console.log("Fetched data:", data);
                return data;
            } catch (error) {
                console.error("Error fetching billing history:", error);
                throw error;
            }
        };

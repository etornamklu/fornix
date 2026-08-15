import React, { useState, useEffect } from "react";

interface INetworkStatus {
    onlineMessage: string;
    offlineMessage: string;
}

const NetworkStatusAlert = ({
    onlineMessage,
    offlineMessage,
}: INetworkStatus) => {
    const [isOffline, setIsOffline] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            if (wasOffline) {
                setIsOffline(false);
                // Automatically hide the "back online" alert after 3 seconds
                setTimeout(() => {
                    setWasOffline(false); 
                }, 2000); 
            }
        };

        const handleOffline = () => {
            setIsOffline(true);
            setWasOffline(true); // Mark that the user has been offline
        };

        // Add event listeners for network changes
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup event listeners on component unmount
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [wasOffline]);

    if (!isOffline && !wasOffline) {
        return null; 
    }

    return isOffline ? (
        <div className="fixed z-50 top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-md shadow-md">
            <p>{offlineMessage}</p>
        </div>
    ) : (
        <div className="fixed z-50 top-4 left-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-md">
            <p>{onlineMessage}</p>
        </div>
    );
};

export default NetworkStatusAlert;

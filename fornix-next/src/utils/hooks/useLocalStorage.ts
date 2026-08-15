import {useEffect, useState} from 'react';

function useLocalStorage(key: string, initialValue: any) {
    // Check if we're in the browser environment
    const isBrowser = typeof window !== 'undefined';

    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
        if (!isBrowser) {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: any) => {
        if (!isBrowser) {
            return;
        }

        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // Dispatch a custom event to notify other components
            window.dispatchEvent(
                new CustomEvent('local-storage-change', {
                    detail: {key, newValue: valueToStore},
                })
            );
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!isBrowser) {
            return;
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : null;
                    setStoredValue(newValue);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        const handleCustomEvent = (e: CustomEvent) => {
            if (e.detail.key === key) {
                setStoredValue(e.detail.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('local-storage-change', handleCustomEvent as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(
                'local-storage-change',
                handleCustomEvent as EventListener
            );
        };
    }, [key, isBrowser]);

    return [storedValue, setValue];
}

export default useLocalStorage;
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';

const useConfirmExit = () => {
    useEffect(() => {
        const handleBeforeUnload = (event: any) => {
            event.preventDefault()
            event.returnValue = 'exit check' // for most browsers
            return 'exit check' // for some older browsers
        };

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [])
}

export default useConfirmExit;

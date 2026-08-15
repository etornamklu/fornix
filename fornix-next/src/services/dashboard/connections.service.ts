import {BACKEND_BASE_URL} from "@/utils/constants";
import {signOut} from "next-auth/react";
import {getBearerToken} from "@/utils/auth.server";
import {updateUserCredits} from "@/utils/dashboard/credit";

export const getAllConnections = async () => {
    const url = BACKEND_BASE_URL + '/connections'

    const connectionsResponse = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${await getBearerToken()}`
        }
    })

    const credits = connectionsResponse.headers.get('x-credits') ?? ''
    await updateUserCredits(credits)

    if (connectionsResponse.status === 401) signOut()

                return connectionsResponse.status === 200 ? (await connectionsResponse.json()).connections : null
            }

export const openConnectionSocket = (userCode: string, onMessage: (message: string) => void) => {
    const socket = new WebSocket(`ws://localhost:8000/ws/connect/${userCode}`)

    socket.onopen = () => {
        console.log('WebSocket connection opened')

        // socket.send(JSON.stringify({message: 'Hello from client!'}))
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('Message received from server:', data)

        // add update for when doctor receives a message
        onMessage(data)
    }

    socket.onclose = (event) => {
        console.log('WebSocket connection closed', event)
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error)
    };

    const sendMessage = (message: string) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message))
        } else {
            console.error('WebSocket is not open. Unable to send message.')
        }
    };

    return {socket, sendMessage}
}

export const deleteConnection = async (userCode: string) => {
    const url = `${BACKEND_BASE_URL}/connections/delete/${userCode}`

    const deleteResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await getBearerToken()}`,
            'Content-Type': 'application/json'
        }
    })

    const credits = deleteResponse.headers.get('x-credits') ?? ''
    await updateUserCredits(credits)

    if (deleteResponse.status === 401) {
        signOut()
        return null
    }

    if (deleteResponse.status === 200) {
        return await deleteResponse.json()
    }

    return null
}

export const handleConnectionRequest = async (action: string, doctorUserCode: string) => {
    const url = `${BACKEND_BASE_URL}/connections/${action}/${doctorUserCode}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await getBearerToken()}`,
            'Content-Type': 'application/json'
        }
    })

    const credits = response.headers.get('x-credits') ?? ''
    await updateUserCredits(credits)

    if (response.status === 401) {
        signOut()
    }

    const result = await response.json();

    return result.status === 200 ? (await response.json()).message : null
}

export const sendConnectionRequest = async (patientUserCode: string) => {
    const url = `${BACKEND_BASE_URL}/connections/create/${patientUserCode}`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await getBearerToken()}`,
            'Content-Type': 'application/json'
        }
    })

    const credits = response.headers.get('x-credits') ?? ''
    await updateUserCredits(credits)

    if (response.status === 401) signOut()

    const result = await response.json()

    return {status: response.status, message: result.message || result.detail}
}

export const findPatientRequest = async (patientUserCode: string) => {
    const url = `${BACKEND_BASE_URL}/connections/userinfo/${patientUserCode}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${await getBearerToken()}`,
        }
    })

    if (response.status === 401) signOut()

    const result = await response.json()

    return {status: response.status, patient: result.user}
}

from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict
from starlette.websockets import WebSocketState
from contextlib import contextmanager


class SocketManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SocketManager, cls).__new__(cls)
            cls._instance.active_connections = {}  # Map user_id to WebSocket
        return cls._instance

    async def connect(self, websocket: WebSocket, user_id: str):
        # Ensure only one connection per user
        if user_id in self.active_connections:
            await self.close_socket(user_id)

        await websocket.accept()
        self.active_connections[user_id] = websocket

    async def close_socket(self, user_id: str):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            if (websocket.application_state == WebSocketState.CONNECTED
                    and websocket.client_state == WebSocketState.CONNECTED):
                await websocket.close()
            del self.active_connections[user_id]

    async def get_socket(self, user_id: str) -> WebSocket:
        return self.active_connections.get(user_id)

    async def send_data(self, user_id: str, event_type: str, data: str):
        """
        Send data to a specific user based on event type.
        """
        websocket = await self.get_socket(user_id)
        if websocket:
            message = {"event": event_type, "data": data}
            await websocket.send_json(message)

    async def receive_data(self, user_id: str) -> str:
        """
        Receive and return text data from a socket associated with a specific user ID.
        """
        websocket = await self.get_socket(user_id)
        if websocket:
            return await websocket.receive_text()
        else:
            raise ValueError(f"No active connection found for user ID: {user_id}")

    async def broadcast(self, event_type: str, data: str):
        """
        Broadcast data to all active connections.
        """
        message = {"event": event_type, "data": data}
        for websocket in self.active_connections.values():
            await websocket.send_json(message)


# Dependency injection function
def get_socket_manager():
    # Return the singleton instance of SocketManager
    socket_manager = SocketManager()
    try:
        yield socket_manager
    finally:
        # Any cleanup if necessary
        pass

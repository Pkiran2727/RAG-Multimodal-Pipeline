from fastapi import WebSocket
from typing import Dict
import json
from datetime import datetime

class WSManager:
    def __init__(self):
        # key: f"{user_id}:{job_id}"
        self._connections: Dict[str, WebSocket] = {}

    async def connect(self, job_id: str, websocket: WebSocket, user_id: str):
        await websocket.accept()
        key = f"{user_id}:{job_id}"
        self._connections[key] = websocket

    async def disconnect(self, job_id: str, user_id: str):
        key = f"{user_id}:{job_id}"
        if key in self._connections:
            del self._connections[key]

    async def emit(self, job_id: str, user_id: str, event: dict):
        key = f"{user_id}:{job_id}"
        ws = self._connections.get(key)
        if ws:
            event["timestamp"] = datetime.utcnow().isoformat()
            await ws.send_json(event)

ws_manager = WSManager()

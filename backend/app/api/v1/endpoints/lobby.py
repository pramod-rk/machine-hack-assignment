from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.auth import get_current_user_ws
from core.websocket import ws_manager

router = APIRouter()

@router.websocket("/ws/lobby/{room_code}")
async def lobby_ws(websocket: WebSocket, room_code: str, username: str):
    await ws_manager.connect(room_code, websocket, username)
    try:
        while True:
            data = await websocket.receive_text()  # Keep alive or process events
    except WebSocketDisconnect:
        ws_manager.disconnect(room_code, websocket, username)
        await ws_manager.broadcast(room_code, {
            "type": "lobby_update",
            "participants": list(ws_manager.lobby_participants.get(room_code, []))
        })

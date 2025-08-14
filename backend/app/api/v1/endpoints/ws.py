# app/api/v1/endpoints/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from core.websocket import ws_manager
from core.security import decode_access_token
from core.config import settings
from db.session import SessionLocal
from models.user import User
import json
import logging

router = APIRouter()

# logging.basicConfig(level=logging.INFO)


# mount path: /ws/rooms/{room_code}
@router.websocket("/ws/rooms/{room_code}")
async def room_ws(websocket: WebSocket, room_code: str):
    """
    WebSocket connection for a given room_code.
    Authentication: expects the access token cookie set by login (HttpOnly cookie).
    """
    # Extract token from cookies\
    logger = logging.getLogger("uvicorn.error")
    logger.info("prk isnid")
    token = websocket.cookies.get(settings.ACCESS_TOKEN_NAME)
    logger.info(f"prk token: {token}")
    # print("prk print token", token)
    if not token:
        # must close with 403
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    logger.info(f"prk payload: {payload}")
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    logger.info(f"prk user_id: {user_id}")
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Optionally fetch user details for richer presence
    db = SessionLocal()
    user = db.query(User).filter(User.id == int(user_id)).first()
    db.close()
    logger.info(f"prk user: {user}")
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    logger.info(f"prk ws connecting")
    await ws_manager.connect(room_code, websocket, int(user_id))
    logger.info(f"prk ws connected:")
    try:
        # inform the joining user's room peers about updated lobby using DB as source-of-truth
        # but we also have an in-memory presence map; the rooms' official participant list is in DB
        # we expect the HTTP join endpoint will already have added the user to DB; if not, front-end
        # can call 'join' first and then open WS.
        logger.info(f"prk sending text:")
        await websocket.send_text(json.dumps({"type": "connected", "room": room_code}))
        logger.info(f"prk sent text: ")
        # keep connection open and handle incoming messages if any
        while True:
            data = await websocket.receive_text()
            logger.info(f"prk receive text: {data}")
            # basic echo / control messages or ping from client
            # Expect client to send JSON commands; ignore unknowns
            try:
                msg = json.loads(data)
                logger.info(f"prk receive msg: {msg}")
            except Exception:
                continue

            # Example: client sends {"type":"ping"} => respond with pong
            if msg.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            # you can implement actions like chat, ready flags, etc.
    except WebSocketDisconnect:
        await ws_manager.disconnect(room_code, websocket, int(user_id))
    except Exception:
        # ensure clean disconnect
        await ws_manager.disconnect(room_code, websocket, int(user_id))
        await websocket.close()

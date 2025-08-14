# app/core/websocket.py
import asyncio
from typing import Dict, Set
from fastapi import WebSocket
import json
import logging

class RoomConnections:
    def __init__(self):
        self.connections: Set[WebSocket] = set()
        self.participant_ids: Set[int] = set()
        self.lock = asyncio.Lock()

class WebSocketManager:
    def __init__(self):
        # room_code -> RoomConnections
        self.rooms: Dict[str, RoomConnections] = {}

    async def connect(self, room_code: str, websocket: WebSocket, user_id: int):
        await websocket.accept()
        room = self.rooms.setdefault(room_code, RoomConnections())
        async with room.lock:
            room.connections.add(websocket)
            room.participant_ids.add(user_id)

    async def disconnect(self, room_code: str, websocket: WebSocket, user_id: int):
        room = self.rooms.get(room_code)
        if not room:
            return
        async with room.lock:
            if websocket in room.connections:
                room.connections.remove(websocket)
            if user_id in room.participant_ids:
                room.participant_ids.remove(user_id)
            if not room.connections:
                self.rooms.pop(room_code, None)

    async def send_to_room(self, room_code: str, message: dict):
        room = self.rooms.get(room_code)
        if not room:
            return
        payload = json.dumps(message)
        async with room.lock:
            coros = [conn.send_text(payload) for conn in room.connections]
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

    async def broadcast_lobby(self, room_code: str, participants: list):
        await self.send_to_room(room_code, {"type": "lobby_update", "participants": participants})

    # async def broadcast_question(self, room_code: str, question: dict):
    #     await self.send_to_room(room_code, {"type": "new_question", "question": question})

    async def broadcast_question(self, room_code: str, question, rnd):
        """
        Sends a new question to the room.
        Accepts either a SQLAlchemy Question model or a dict.
        Ensures round_id is included for the frontend.
        """
        logger = logging.getLogger("uvicorn.error")
        logger.info(f"prk ws connectoin log ")
        if not isinstance(question, dict):
            # likely SQLAlchemy model
            # rnd = getattr(question, "_rnd", None)
            
            logger.info(f"prk ws connectoin round id {rnd}")
            question_payload = {
                "id": question.id,
                "text": question.text,
                "round_id": getattr(rnd, "id", None)
            }
            # include other fields your frontend might use
            if hasattr(question, "options"):
                question_payload["options"] = question.options
        else:
            logger.info(f"prk ws connectoin inside else")
            question_payload = dict(question)
            logger.info(f"prk ws connectoin inside else question_payload : {question_payload}")
            if "round_id" not in question_payload:
                question_payload["round_id"] = getattr(question, "round_id", getattr(rnd, "id", None))

        await self.send_to_room(room_code, {
            "type": "new_question",
            "question": question_payload
        })

    async def broadcast_new_answer(self, room_code: str, answer_stub: dict):
        """
        answer_stub must be anonymized: {id, anon_tag, created_at}
        """
        await self.send_to_room(room_code, {"type": "new_answer", "answer": answer_stub})

    async def broadcast_vote_update(self, room_code: str, vote_info: dict):
        """
        vote_info: {answer_id, votes_count}
        """
        await self.send_to_room(room_code, {"type": "vote_update", "vote": vote_info})

    async def broadcast_leaderboard(self, room_code: str, leaderboard: list):
        """
        leaderboard: [{user_id, email(optional), score}]
        """
        await self.send_to_room(room_code, {"type": "leaderboard", "leaderboard": leaderboard})

# singleton
ws_manager = WebSocketManager()

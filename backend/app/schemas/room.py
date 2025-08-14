# app/schemas/room.py
from pydantic import BaseModel
from typing import List
from datetime import datetime
from models.room import RoomStatus

class RoomBase(BaseModel):
    room_code: str
    status: RoomStatus
    host_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RoomCreateResponse(RoomBase):
    id: int

class JoinRoomRequest(BaseModel):
    room_code: str

class RoomParticipantOut(BaseModel):
    id: int
    user_id: int
    joined_at: datetime

    class Config:
        from_attributes = True

class RoomDetail(RoomBase):
    participants: List[RoomParticipantOut]

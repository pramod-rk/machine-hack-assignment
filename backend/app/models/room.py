# app/models/room.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.base import Base

class RoomStatus(str, enum.Enum):
    waiting = "waiting"
    in_progress = "in_progress"
    finished = "finished"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, unique=True, index=True, nullable=False)
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(RoomStatus), default=RoomStatus.waiting)
    created_at = Column(DateTime, default=datetime.utcnow)

    host = relationship("User", backref="hosted_rooms")
    participants = relationship("RoomParticipant", back_populates="room")

class RoomParticipant(Base):
    __tablename__ = "room_participants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="participants")
    user = relationship("User", backref="rooms_joined")

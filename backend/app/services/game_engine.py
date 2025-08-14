# app/services/game_engine.py
import random, string
from sqlalchemy.orm import Session
from models.room import Room, RoomParticipant, RoomStatus
from models.round import Round
from services import ai

def generate_room_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def create_room(db: Session, host_user_id: int) -> Room:
    code = generate_room_code()
    while db.query(Room).filter(Room.room_code == code).first():
        code = generate_room_code()

    room = Room(room_code=code, host_user_id=host_user_id)
    db.add(room)
    db.commit()
    db.refresh(room)

    participant = RoomParticipant(room_id=room.id, user_id=host_user_id)
    db.add(participant)
    db.commit()

    return room

def join_room(db: Session, user_id: int, room_code: str) -> Room:
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if not room:
        raise ValueError("Room not found")
    if room.status != RoomStatus.waiting:
        raise ValueError("Cannot join — game already started")

    existing = db.query(RoomParticipant).filter_by(room_id=room.id, user_id=user_id).first()
    if not existing:
        participant = RoomParticipant(room_id=room.id, user_id=user_id)
        db.add(participant)
        db.commit()

    return room

def start_game(db: Session, host_user_id: int, room_code: str) -> Room:
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if not room:
        raise ValueError("Room not found")
    if room.host_user_id != host_user_id:
        raise ValueError("Only host can start the game")
    if room.status != RoomStatus.waiting:
        raise ValueError("Game already started or finished")

    room.status = RoomStatus.in_progress
    db.commit()
    db.refresh(room)

    # create first round with AI-generated question
    question = ai.generate_question()
    rnd = Round(room_id=room.id, round_number=1, question_text=question["text"])
    db.add(rnd)
    db.commit()
    db.refresh(rnd)

    # attach the generated question dict to return (so controllers can use it)
    room._current_round = rnd
    room._question = question
    return room

def create_round(db: Session, room_id: int, round_number: int, question_text: str) -> Round:
    rnd = Round(room_id=room_id, round_number=round_number, question_text=question_text)
    db.add(rnd)
    db.commit()
    db.refresh(rnd)
    return rnd

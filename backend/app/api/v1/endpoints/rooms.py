# app/api/v1/endpoints/rooms.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from schemas.room import RoomCreateResponse, JoinRoomRequest, RoomDetail
from core.auth import get_current_user
from services import game_engine
from core.websocket import ws_manager
from models.room import RoomParticipant

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("/", response_model=RoomCreateResponse)
async def create_room(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    room = game_engine.create_room(db, host_user_id=current_user.id)
    return room

@router.post("/join", response_model=RoomDetail)
async def join_room(
    req: JoinRoomRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        room = game_engine.join_room(db, current_user.id, req.room_code)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    participants = (
        db.query(RoomParticipant)
        .filter(RoomParticipant.room_id == room.id)
        .all()
    )
    participants_out = [
        {"id": p.user.id, "email": p.user.email} for p in participants
    ]

    # await broadcast
    await ws_manager.broadcast_lobby(req.room_code, participants_out)
    return room

@router.post("/start", response_model=RoomDetail)
async def start_game(
    req: JoinRoomRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        room = game_engine.start_game(db, current_user.id, req.room_code)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # If game_engine attached the initial round & question
    rnd = getattr(room, "_current_round", None)
    question = getattr(room, "_question", None)
    participants = (
        db.query(RoomParticipant)
        .filter(RoomParticipant.room_id == room.id)
        .all()
    )
    participants_out = [{"id": p.user.id, "email": p.user.email} for p in participants]
    # broadcast lobby update and question
    await ws_manager.broadcast_lobby(req.room_code, participants_out)
    if question:
        await ws_manager.broadcast_question(req.room_code, question, rnd)

    return room

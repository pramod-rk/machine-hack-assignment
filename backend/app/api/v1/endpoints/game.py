# app/api/v1/endpoints/game.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from core.auth import get_current_user
from schemas.game import AnswerCreate, AnswerOut, VoteCreate, LeaderboardEntry
from models.room import Room
from models.room import RoomParticipant
from models.answer import Answer
from models.round import Round
from models.vote import Vote
from services import   scoring
from core.websocket import ws_manager
from datetime import datetime
from services import ai
import uuid
import logging

router = APIRouter(prefix="/game", tags=["game"])
TOTAL_QUESTIONS = 3

def _generate_anon_tag(db: Session, room_id: int) -> str:
    # simple random tag: Anon-XXXX
    return "Anon-" + uuid.uuid4().hex[:4].upper()

@router.post("/submit", response_model=AnswerOut)
async def submit_answer(payload: AnswerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Find room
    logger = logging.getLogger("uvicorn.error")
    logger.info("prk game inside ")
    room = db.query(Room).filter(Room.room_code == payload.room_code).first()
    logger.info(f"prk game inside roomp,,{room}")
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    


    # Create answer with anon tag
    anon_tag = _generate_anon_tag(db, room.id)
    answer = Answer(
        room_id=room.id,
        round_id=payload.round_id,
        user_id=current_user.id,
        anon_tag=anon_tag,
        text=payload.text
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    # Build anonymized stub for broadcast (no user id)
    stub = {"id": answer.id, "anon_tag": answer.anon_tag, "created_at": answer.created_at.isoformat()}

    # broadcast to room
    await ws_manager.broadcast_new_answer(payload.room_code, stub)

    # Validate user is a participant
    participant = db.query(RoomParticipant).filter_by(room_id=room.id, user_id=current_user.id).first()
    logger.info(f"prk game inside participant,,{participant}")
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    # return anonymized representation (votes_count initially 0)
    return {"id": answer.id, "anon_tag": answer.anon_tag, "created_at": answer.created_at, "votes_count": 0}

@router.post("/vote")
async def vote(payload: VoteCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # find answer
    answer = db.query(Answer).filter(Answer.id == payload.answer_id).first()
    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")

    # cannot vote your own answer
    if answer.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot vote for your own answer")

    # ensure voter is participant of that room
    participant = db.query(RoomParticipant).filter_by(room_id=answer.room_id, user_id=current_user.id).first()
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    # prevent duplicate votes (UniqueConstraint exists)
    existing = db.query(Vote).filter_by(answer_id=payload.answer_id, voter_user_id=current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already voted")

    vote = Vote(answer_id=payload.answer_id, voter_user_id=current_user.id)
    db.add(vote)
    db.commit()
    db.refresh(vote)

    # compute new votes count for that answer
    votes_count = db.query(Vote).filter(Vote.answer_id == payload.answer_id).count()

    # broadcast vote update
    room = db.query(Room).filter(Room.id == answer.room_id).first()
    await ws_manager.broadcast_vote_update(room.room_code, {"answer_id": payload.answer_id, "votes_count": votes_count})

    # broadcast leaderboard (recompute)
    leaderboard = scoring.compute_leaderboard(db, room.id)
    await ws_manager.broadcast_leaderboard(room.room_code, leaderboard)

    # Get current round
    current_round = db.query(Round).filter_by(id=answer.round_id).first()
    # Get all answers for this round
    answers_this_round = db.query(Answer).filter_by(room_id=room.id, round_id=answer.round_id).all()
    total_participants = db.query(RoomParticipant).filter_by(room_id=room.id).count()
    # Each participant should vote once for each answer except their own
    expected_votes = len(answers_this_round) * (total_participants - 1)
    votes_this_round = db.query(Vote).join(Answer).filter(
        Answer.room_id == room.id,
        Answer.round_id == answer.round_id
    ).count()

    if votes_this_round == expected_votes:
        # All votes are in for this round
        if current_round.round_number < TOTAL_QUESTIONS:
            # Create next round/question
            next_round_number = current_round.round_number + 1
            question = ai.generate_question()
            new_round = Round(room_id=room.id, round_number=next_round_number, question_text=question["text"])
            db.add(new_round)
            db.commit()
            db.refresh(new_round)
            await ws_manager.broadcast_question(room.room_code, question, new_round)
        else:
            # Game over, broadcast leaderboard
            leaderboard = scoring.compute_leaderboard(db, room.id)
            await ws_manager.broadcast_leaderboard(room.room_code, leaderboard)
            await ws_manager.send_to_room(room.room_code, {
                "type": "game_over",
                "leaderboard": leaderboard
            })
    return {"answer_id": payload.answer_id, "votes_count": votes_count}

@router.get("/leaderboard")
def leaderboard(room_code: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # ensure caller is participant
    participant = db.query(RoomParticipant).filter_by(room_id=room.id, user_id=current_user.id).first()
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    leaderboard = scoring.compute_leaderboard(db, room.id)
    return leaderboard

# app/services/scoring.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.answer import Answer
from models.vote import Vote
from models.room import RoomParticipant
from models.user import User

def update_score_for_vote(db: Session, answer_id: int):
    """
    This simple strategy awards 1 point to the answer owner for each vote.
    Scores are computed on-demand when requested. We don't persist a separate
    'scores' table here for simplicity.
    """
    # Count votes per user across answers in the room
    # We'll leave this function as a no-op for write; leaderboard computed via query
    pass

def compute_leaderboard(db: Session, room_id: int):
    """
    Returns list of dicts {user_id, email, score} ordered desc by score
    """
    # Join answers -> votes -> users
    # Count votes per answer owner
    from models.answer import Answer
    from models.vote import Vote
    from models.user import User
    q = (
        db.query(Answer.user_id.label("user_id"), User.email, func.count(Vote.id).label("score"))
        .join(User, User.id == Answer.user_id)
        .outerjoin(Vote, Vote.answer_id == Answer.id)
        .filter(Answer.room_id == room_id)
        .group_by(Answer.user_id, User.email)
        .order_by(func.count(Vote.id).desc())
    )
    results = q.all()
    leaderboard = [{"user_id": r.user_id, "email": r.email, "score": int(r.score)} for r in results]
    return leaderboard

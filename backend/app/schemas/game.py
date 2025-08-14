# app/schemas/game.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoundOut(BaseModel):
    id: int
    room_id: int
    round_number: int
    question_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnswerCreate(BaseModel):
    room_code: str
    round_id: int
    text: str

class AnswerOut(BaseModel):
    id: int
    anon_tag: str
    created_at: datetime
    votes_count: int = 0

    class Config:
        from_attributes = True

class VoteCreate(BaseModel):
    answer_id: int

class LeaderboardEntry(BaseModel):
    user_id: int
    email: Optional[str]
    score: int

# app/models/answer.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    anon_tag = Column(String, nullable=False)   # e.g. "Player A" or "Anon-4F3"
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    round = relationship("Round", back_populates="answers")
    user = relationship("User")

# app/models/round.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base

class Round(Base):
    __tablename__ = "rounds"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    round_number = Column(Integer, nullable=False, default=1)
    question_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    answers = relationship("Answer", back_populates="round")

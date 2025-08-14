# app/db/init_db.py
from db.base import Base
from db.session import engine

def init_db():
    Base.metadata.create_all(bind=engine)

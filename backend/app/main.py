# from fastapi import FastAPI
# from api.v1.endpoints import rooms

# app = FastAPI()


# app.include_router(rooms.router, prefix="/v1", tags=["my rooms"])



from fastapi import FastAPI
from api.v1.endpoints import auth, rooms, ws, game
from db.init_db import init_db
from fastapi.middleware.cors import CORSMiddleware
import logging


app = FastAPI(title="Voting Game API")

origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",  # Some browsers resolve like this
    "https://machine-hack-assignment-beta.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # or limit to ["GET", "POST", "OPTIONS", ...]
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(rooms.router, prefix="/api/v1")
app.include_router(ws.router, prefix="/api/v1")
app.include_router(game.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    init_db()
    logger = logging.getLogger("uvicorn.error")
    logger.info("prk WebSocket module loaded")


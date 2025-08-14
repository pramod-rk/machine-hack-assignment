# app/core/auth.py
from fastapi import WebSocket, Request, Depends, HTTPException, status
from core.security import decode_access_token
from core.config import settings
from db.session import get_db
from sqlalchemy.orm import Session
from models.user import User
from jose import jwt, JWTError

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(settings.ACCESS_TOKEN_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def get_current_user_ws(websocket: WebSocket, db: Session) -> User:
    """
    Authenticate user in a WebSocket connection by reading JWT from cookies.
    """
    token = None
    if "access_token" in websocket.cookies:
        token = websocket.cookies.get("access_token")

    if not token:
        # Optionally also allow ?token= in URL query params
        query_params = dict(websocket.query_params)
        token = query_params.get("token")

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=status.WS_1008_POLICY_VIOLATION, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.WS_1008_POLICY_VIOLATION, detail="Invalid token")
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=status.WS_1008_POLICY_VIOLATION, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=status.WS_1008_POLICY_VIOLATION, detail="User not found")

    return user
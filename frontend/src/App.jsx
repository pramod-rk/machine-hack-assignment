// src/App.jsx
import React, { useEffect, useState } from "react";
import LoginForm from "./components/LoginForm";
import CreateJoinRoom from "./components/CreateJoinRoom";
import GameRoom from "./components/GameRoom";
import { logout, getLeaderboard } from "./services/api";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // You could call /me endpoint to fetch current user (server must provide)
  async function refreshUser() {
    try {
      // If you implemented a /me protected endpoint, call it here to fetch email and id
      // const current = await apiFetch("/auth/me");
      // setUserEmail(current.email);
    } catch {}
  }

  useEffect(() => { refreshUser(); }, []);

  function onLoggedIn() {
    setLoggedIn(true);
    refreshUser();
  }

  function onJoined(newRoomCode, roomObj) {
    setRoomCode(newRoomCode);
    setRoom(roomObj);
    // host detection — room.host_user_id available from backend create/join
    // ideally return whether current user is host from backend /me or room payload
    // for demo, rely on server returning participant array and match by email if available
    // we leave isHost to true if current user created the room (caller set)
    setIsHost(true); // set appropriately in real app
  }

  async function doLogout() {
    await logout();
    setLoggedIn(false);
    setRoomCode(null);
    setRoom(null);
    setUserEmail(null);
  }

  if (!loggedIn) {
    return <LoginForm onLoggedIn={onLoggedIn} />;
  }

  if (!roomCode) {
    return <CreateJoinRoom onJoined={onJoined} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: 12 }}>
        <div>Logged in as: {userEmail ?? "you"}</div>
        <div>
          <button onClick={doLogout}>Logout</button>
        </div>
      </div>

      <GameRoom roomCode={roomCode} initialRoom={room} isHost={isHost} currentUserEmail={userEmail} />
    </div>
  );
}

// src/App.jsx
import React, { useEffect, useState } from "react";
import LoginForm from "./components/LoginForm";
import CreateJoinRoom from "./components/CreateJoinRoom";
import GameRoom from "./components/GameRoom";
import { logout } from "./services/api";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    try {

    } catch {}
    setIsLoading(false);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  function onLoggedIn() {
    setLoggedIn(true);
    refreshUser();
  }

  function onJoined(newRoomCode, roomObj) {
    setRoomCode(newRoomCode);
    setRoom(roomObj);
    setIsHost(true);
  }

  async function doLogout() {
    await logout();
    setLoggedIn(false);
    setRoomCode(null);
    setRoom(null);
    setUserEmail(null);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!loggedIn) return <LoginForm onLoggedIn={onLoggedIn} />;
  if (!roomCode) return <CreateJoinRoom onJoined={onJoined} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white font-medium">
            Welcome, {userEmail ?? "Player"}!
          </div>
          <button 
            onClick={doLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>
      <GameRoom 
        roomCode={roomCode} 
        initialRoom={room} 
        isHost={isHost} 
        currentUserEmail={userEmail} 
      />
    </div>

  );
}

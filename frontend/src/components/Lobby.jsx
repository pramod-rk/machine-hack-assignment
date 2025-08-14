// src/components/Lobby.jsx
import React from "react";

export default function Lobby({ roomCode, participants, isHost, onStart }) {
  return (
    <div style={{ padding: 12 }}>
      <h3>Room {roomCode}</h3>
      <div>
        <strong>Players:</strong>
        <ul>
          {participants.map(p => <li key={p.id}>{p.email} {p.you ? "(you)" : ""}</li>)}
        </ul>
      </div>
      {isHost && <button onClick={onStart}>Start Game</button>}
    </div>
  );
}

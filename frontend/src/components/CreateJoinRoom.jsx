// src/components/CreateJoinRoom.jsx
import React, { useState } from "react";
import { createRoom, joinRoom } from "../services/api";

export default function CreateJoinRoom({ onJoined }) {
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");

  async function handleCreate() {
    setErr("");
    try {
      const room = await createRoom();
      onJoined(room.room_code, room);
    } catch (e) {
      setErr(e.message || "Create failed");
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setErr("");
    try {
      const room = await joinRoom(joinCode.trim().toUpperCase());
      onJoined(joinCode.trim().toUpperCase(), room);
    } catch (e) {
      setErr(e.message || "Join failed");
    }
  }

  return (
    <div style={{ maxWidth: 540, margin: "1rem auto" }}>
      <button onClick={handleCreate}>Create Room ddd</button>
      <hr />
      <form onSubmit={handleJoin}>
        <input placeholder="Room code (ABC123)" value={joinCode} onChange={e=>setJoinCode(e.target.value)} required/>
        <button type="submit">Join Room</button>
      </form>
      {err && <div style={{color: "red"}}>{err}</div>}
    </div>
  );
}

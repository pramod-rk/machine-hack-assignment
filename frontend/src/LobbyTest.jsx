import { useState } from "react";

export default function LobbyTest() {
  const [email, setEmail] = useState("user2@example.com");
  const [password, setPassword] = useState("pass123");
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [ws, setWs] = useState(null);

  const login = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        credentials: "include", // send/receive cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
    } catch (err) {
      setMessage("Login failed");
    }
  };

  const createRoom = async () => {
    const res = await fetch("http://localhost:8000/api/v1/rooms", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Room" }),
    });
    const data = await res.json();
    setRoomCode(data.code);
    setMessage("Room created: " + data.code);
  };

  const joinRoom = async () => {
    // REST join to ensure DB update
    await fetch(`http://localhost:8000/api/v1/rooms/${roomCode}/join`, {
      method: "POST",
      credentials: "include",
    });

    // WebSocket join for real-time updates
    const socket = new WebSocket(
      `ws://localhost:8000/ws/lobby/${roomCode}`
    );
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "lobby_update") {
        setParticipants(data.participants);
      }
    };
    setWs(socket);
  };

  const startGame = async () => {
    await fetch(`http://localhost:8000/api/v1/rooms/${roomCode}/start`, {
      method: "POST",
      credentials: "include",
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Test Game Lobby</h2>

      <div>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Login</button>
      </div>

      <div>
        <button onClick={createRoom}>Create Roomss</button>
        <input
          placeholder="Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={startGame}>Start Game</button>
      </div>

      <div>
        <h3>Participants:</h3>
        <ul>
          {participants.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div>
        <p>Status: {message}</p>
      </div>
    </div>
  );
}

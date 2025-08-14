// src/components/GameRoom.jsx
import React, { useCallback, useState } from "react";
import useRoomWebsocket from "../hooks/useRoomWebsocket";
import { submitAnswer, voteAnswer, startRoom } from "../services/api";

export default function GameRoom({ roomCode, initialRoom, currentUserEmail, isHost }) {
  const [participants, setParticipants] = useState((initialRoom.participants || []).map(p => ({...p, you: p.email === currentUserEmail})));
  const [question, setQuestion] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [answers, setAnswers] = useState([]); // anonymized {id, anon_tag, created_at, votes_count}
  const [text, setText] = useState("");

  const onMessage = useCallback((msg) =>{
    if (msg.type === "lobby_update") {
      setParticipants(msg.participants.map(p => ({...p, you: p.email === currentUserEmail})));
    } else if (msg.type === "new_question") {
        setQuestion(msg.question);
        // round_id is now guaranteed from backend
        setRoundId(msg.question.round_id);
        setAnswers([]); // clear answers for the new round
        setAnswers([]);
    } else if (msg.type === "new_answer") {
      setAnswers(prev => [...prev, { ...msg.answer, votes_count: 0 }]);
    } else if (msg.type === "vote_update") {
      setAnswers(prev => prev.map(a => a.id === msg.vote.answer_id ? { ...a, votes_count: msg.vote.votes_count } : a));
    } else if (msg.type === "leaderboard") {
      // optional: show leaderboard overlay
      console.log("leaderboard", msg.leaderboard);
    }
  },[currentUserEmail])

  const { connected } = useRoomWebsocket(roomCode, onMessage);

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('prk round id , ',roundId);
    console.log('prk text , ',text);
    if (!text || !roundId) return alert("No round selected or empty answer");
    try {
      await submitAnswer(roomCode, roundId, text);
      setText("");
    } catch (e) {
      alert(e.message || "Submit failed");
    }
  }

  async function handleVote(answerId) {
    try {
      await voteAnswer(answerId);
    } catch (e) {
      alert(e.message || "Vote failed");
    }
  }

  async function handleStart() {
    try {
      const res = await startRoom(roomCode);
      // If server returns round info we should set it here:
      // e.g. res._current_round or res.question ... adapt if start endpoint returns round id.
      // For now we rely on ws broadcast to populate question/round.
    } catch (e) {
      alert(e.message || "Start failed");
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Room: {roomCode} {connected ? "(connected)" : "(ws disconnected)"}</h2>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h4>Lobby</h4>
          <ul>{participants.map(p => <li key={p.id}>{p.email} {p.you ? "(you)" : ""}</li>)}</ul>
          {isHost && <button onClick={handleStart}>Start Game</button>}
        </div>

        <div style={{ flex: 2 }}>
          <h4>Question</h4>
          {question ? <div><b>{question.text}</b></div> : <div>Waiting for host to start the game...</div>}

          <h4 style={{ marginTop: 14 }}>Submit Answer</h4>
          <form onSubmit={handleSubmit}>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} style={{ width: "100%" }} />
            <button type="submit" >Submit Answer</button>
          </form>

          <h4 style={{ marginTop: 14 }}>Answers</h4>
          <ul>
            {answers.map(a => (
              <li key={a.id} style={{ marginBottom: 8 }}>
                <div><b>{a.anon_tag}</b> — "{a.text ?? "(hidden text, server may choose not to broadcast full text)"}"</div>
                <div>Votes: {a.votes_count} <button onClick={() => handleVote(a.id)}>Vote</button></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

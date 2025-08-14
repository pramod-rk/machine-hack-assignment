// src/components/Leaderboard.jsx
import React from "react";

export default function Leaderboard({ entries }) {
  return (
    <div>
      <h4>Leaderboard</h4>
      <ol>
        {entries.map(e => (
          <li key={e.user_id}>
            {e.email ?? `User ${e.user_id}`} — {e.score}
          </li>
        ))}
      </ol>
    </div>
  );
}

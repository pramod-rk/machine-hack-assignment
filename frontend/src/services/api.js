// src/services/api.js
// const API_BASE = process.env.REACT_APP_API_BASE || ""; // e.g. "http://localhost:8000"
const API_BASE = "http://localhost:8000/api/v1" || ""; // e.g. "http://localhost:8000"

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // IMPORTANT: include cookies
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.detail || data || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function register(email, password) {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function login(email, password) {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function createRoom() {
  return apiFetch("/rooms", { method: "POST" });
}

export async function joinRoom(room_code) {
  return apiFetch("/rooms/join", { method: "POST", body: JSON.stringify({ room_code }) });
}

export async function startRoom(room_code) {
  return apiFetch("/rooms/start", { method: "POST", body: JSON.stringify({ room_code }) });
}

export async function submitAnswer(room_code, round_id, text) {
  return apiFetch("/game/submit", {
    method: "POST",
    body: JSON.stringify({ room_code, round_id, text }),
  });
}

export async function voteAnswer(answer_id) {
  return apiFetch("/game/vote", { method: "POST", body: JSON.stringify({ answer_id }) });
}

export async function getLeaderboard(room_code) {
  return apiFetch(`/game/leaderboard?room_code=${encodeURIComponent(room_code)}`);
}

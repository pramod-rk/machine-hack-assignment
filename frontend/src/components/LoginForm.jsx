// src/components/LoginForm.jsx
import React, { useState } from "react";
import { login, register } from "../services/api";

export default function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("user2@example.com");
  const [password, setPassword] = useState("pass123");
  const [isRegister, setIsRegister] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    try {
      if (isRegister) {
        await register(email, password);
        // optionally auto-login after register
      }
      await login(email, password);
      onLoggedIn();
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h3>{isRegister ? "Register" : "Login"}</h3>
      <form onSubmit={submit}>
        <div><input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required/></div>
        <div><input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required/></div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">{isRegister ? "Register" : "Login"}</button>
          <button type="button" onClick={() => setIsRegister(s => !s)} style={{ marginLeft: 8 }}>
            {isRegister ? "Switch to Login" : "Switch to Register"}
          </button>
        </div>
      </form>
      {err && <div style={{ color: "red", marginTop: 8 }}>{err}</div>}
    </div>
  );
}

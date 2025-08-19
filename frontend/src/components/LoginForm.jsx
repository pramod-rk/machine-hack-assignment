// src/components/LoginForm.jsx
import React, { useState } from "react";
import { login, register } from "../services/api";
import { User, Mail, Lock, Sparkles } from "lucide-react";

export default function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [err, setErr] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setIsLoading(true);
    try {
      if (isRegister) await register(email, password);
      await login(email, password);
      onLoggedIn();
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GameHub</h1>
          <p className="text-white/80">Join the fun and start playing!</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white text-center">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-white/70 text-center mt-1">
              {isRegister ? "Join thousands of players" : "Sign in to continue"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200"
                  required
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  isRegister ? "Create Account" : "Sign In"
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRegister(s => !s)}
                className="text-white/80 hover:text-white underline transition-colors duration-200"
              >
                {isRegister 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Create one"
                }
              </button>
            </div>
          </form>

          {err && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm text-center">{err}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/60 text-sm">
          Join friends, answer questions, and climb the leaderboard!
        </div>
      </div>
    </div>
  );
}

// src/components/CreateJoinRoom.jsx
import React, { useState } from "react";
import { createRoom, joinRoom } from "../services/api";
import { Plus, Users, ArrowRight, Hash } from "lucide-react";

export default function CreateJoinRoom({ onJoined }) {
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('select');

  async function handleCreate() {
    setErr("");
    setIsLoading(true);
    try {
      const room = await createRoom();
      onJoined(room.room_code, room);
    } catch (e) {
      setErr(e.message || "Create failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setErr("");
    setIsLoading(true);
    try {
      const room = await joinRoom(joinCode.trim().toUpperCase());
      onJoined(joinCode.trim().toUpperCase(), room);
    } catch (e) {
      setErr(e.message || "Join failed");
    } finally {
      setIsLoading(false);
    }
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Ready to Play?</h1>
            <p className="text-white/80">Create a new room or join an existing one</p>
          </div>

          <div className="space-y-4">
            {/* Create Room Card */}
            <div 
              onClick={() => setMode('create')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200 group transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-xl p-3 mr-4 group-hover:bg-white/30 transition-colors duration-200">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Create Room</h3>
                    <p className="text-white/70 text-sm">Start a new game and invite friends</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" />
              </div>
            </div>

            {/* Join Room Card */}
            <div 
              onClick={() => setMode('join')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200 group transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-xl p-3 mr-4 group-hover:bg-white/30 transition-colors duration-200">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Join Room</h3>
                    <p className="text-white/70 text-sm">Enter a room code to join friends</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create New Room</h1>
            <p className="text-white/80">Start a game and invite your friends!</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                  Creating Room...
                </div>
              ) : (
                "Create Room"
              )}
            </button>

            <button
              onClick={() => setMode('select')}
              className="w-full mt-4 py-2 text-white/80 hover:text-white transition-colors duration-200"
            >
              ← Back to options
            </button>

            {err && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-200 text-sm text-center">{err}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join Game Room</h1>
          <p className="text-white/80">Enter the room code to join your friends</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Enter room code (e.g., ABC123)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 text-center font-mono text-lg tracking-wider"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !joinCode.trim()}
              className="w-full py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                  Joining Room...
                </div>
              ) : (
                "Join Room"
              )}
            </button>
          </form>

          <button
            onClick={() => setMode('select')}
            className="w-full mt-4 py-2 text-white/80 hover:text-white transition-colors duration-200"
          >
            ← Back to options
          </button>

          {err && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm text-center">{err}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

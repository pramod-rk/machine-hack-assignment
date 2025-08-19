// src/components/GameRoom.jsx
import React, { useCallback, useState } from "react";
import useRoomWebsocket from "../hooks/useRoomWebsocket";
import { submitAnswer, voteAnswer, startRoom } from "../services/api";
import { Users, Send, ThumbsUp, Crown, Wifi, WifiOff, Play, Trophy, Medal, Award, Star, X } from "lucide-react";


export default function GameRoom({ roomCode, initialRoom, currentUserEmail, isHost }) {
  const [participants, setParticipants] = useState(
    (initialRoom.participants || []).map((p) => ({
      ...p,
      you: p.email === currentUserEmail,
    }))
  );
  const [question, setQuestion] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedAnswers, setVotedAnswers] = useState(new Set());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const onMessage = useCallback(
    (msg) => {
      if (msg.type === "lobby_update") {
        setParticipants(
          msg.participants.map((p) => ({
            ...p,
            you: p.email === currentUserEmail,
          }))
        );
      } else if (msg.type === "new_question") {
        setQuestion(msg.question);
        setRoundId(msg.question.round_id);
        setAnswers([]);
        setText("");
        setVotedAnswers(new Set());
      } else if (msg.type === "new_answer") {
        setAnswers((prev) => [...prev, { ...msg.answer, votes_count: 0 }]);
      } else if (msg.type === "vote_update") {
        setAnswers((prev) =>
          prev.map((a) =>
            a.id === msg.vote.answer_id
              ? { ...a, votes_count: msg.vote.votes_count }
              : a
          )
        );
      } else if (msg.type === "leaderboard") {
        console.log("leaderboard", msg.leaderboard);
      } else if (msg.type === "game_over") {
        setLeaderboardData(msg.leaderboard);
        setShowLeaderboard(true);
      }
    },
    [currentUserEmail]
  );

  const { connected } = useRoomWebsocket(roomCode, onMessage);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text || !roundId) return alert("No round selected or empty answer");
    setIsSubmitting(true);
    try {
      await submitAnswer(roomCode, roundId, text.trim());
      setText("");
    } catch (e) {
      alert(e.message || "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVote(answerId) {
    if (votedAnswers.has(answerId)) return;
    try {
      await voteAnswer(answerId);
      setVotedAnswers(prev => new Set([...prev, answerId]));
    } catch (e) {
      alert(e.message || "Vote failed");
    }
  }

  async function handleStart() {
    try {
      await startRoom(roomCode);
    } catch (e) {
      alert(e.message || "Start failed");
    }
  }

  function getRankIcon(rank) {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <Star className="w-6 h-6 text-white/60" />;
    }
  }

  function getRankColor(rank) {
    switch (rank) {
      case 1:
        return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30";
      case 2:
        return "from-gray-300/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "from-amber-500/20 to-amber-700/20 border-amber-600/30";
      default:
        return "from-white/5 to-white/10 border-white/20";
    }
  }

  function processLeaderboard(data) {
    const sorted = [...data].sort((a, b) => b.score - a.score);
    
    let currentRank = 1;
    let processed = [];
    
    for (let i = 0; i < sorted.length; i++) {
      const player = sorted[i];

      if (i > 0 && sorted[i - 1].score === player.score) {
        processed.push({ ...player, rank: processed[i - 1].rank });
      } else {
        processed.push({ ...player, rank: currentRank });
      }
      
      currentRank = i + 2; 
    }
    
    return processed;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Room:{" "}
                <span className="font-mono bg-white/20 px-3 py-1 rounded-lg">
                  {roomCode}
                </span>
              </h1>
              <div className="flex items-center text-white/80">
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4 mr-2 text-green-400" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 mr-2 text-red-400" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </div>
            {isHost && (
              <div className="flex items-center text-white/80">
                <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                <span>Host</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lobby */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 sticky top-6">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-white mr-2" />
                <h2 className="text-xl font-semibold text-white">
                  Players ({participants.length})
                </h2>
              </div>

              <div className="space-y-2 mb-6">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                      p.you
                        ? "bg-white/20 border border-white/30"
                        : "bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        connected ? "bg-green-400" : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-white flex-1">
                      {p.email}{" "}
                      {p.you && <span className="text-white/70">(you)</span>}
                    </span>
                    {isHost && p.email === currentUserEmail && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                ))}
              </div>

              {isHost && !question && (
                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 flex items-center justify-center group transform hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Start Game
                </button>
              )}
            </div>
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h2 className="text-lg font-semibold text-white mb-4">
                Current Question
              </h2>
              {question ? (
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <p className="text-xl text-white font-medium leading-relaxed">
                    {question.text}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">
                    {isHost
                      ? "Click 'Start Game' to begin!"
                      : "Waiting for host to start the game..."}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Answer */}
            {question && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Submit Your Answer
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type your creative answer here..."
                      rows={3}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 resize-none"
                      maxLength={200}
                    />
                    <div className="absolute bottom-2 right-2 text-white/50 text-sm">
                      {text.length}/200
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !text.trim()}
                    className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group transform hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                        Submit Answer
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Answers */}
            {answers.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Answers ({answers.length})
                </h3>
                <div className="space-y-3">
                  {answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="bg-white/10 rounded-xl p-4 border border-white/20 transition-all duration-200 hover:bg-white/15"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white/80 font-medium">
                          {answer.anon_tag}
                        </span>
                        <div className="flex items-center text-white/60 text-sm">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {answer.votes_count}
                        </div>
                      </div>
                      {answer.text && (
                        <p className="text-white mb-3 leading-relaxed">
                          {answer.text}
                        </p>
                      )}
                      <button
                        onClick={() => handleVote(answer.id)}
                        disabled={votedAnswers.has(answer.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          votedAnswers.has(answer.id)
                            ? "bg-green-500/20 text-green-300 cursor-default"
                            : "bg-white/10 text-white hover:bg-white/20 transform hover:scale-[1.02]"
                        }`}
                      >
                        {votedAnswers.has(answer.id) ? "Voted!" : "Vote"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-white/80">Final Leaderboard</p>
            </div>

            <div className="space-y-4">
              {processLeaderboard(leaderboardData).map((player, index) => (
                <div
                  key={player.user_id}
                  className={`bg-gradient-to-r ${getRankColor(
                    player.rank
                  )} rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4">{getRankIcon(player.rank)}</div>
                      <div>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-white mr-3">
                            #{player.rank}
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {player.email}
                              {player.email === currentUserEmail && (
                                <span className="text-white/70 ml-2">
                                  (You)
                                </span>
                              )}
                            </h3>
                            <p className="text-white/70">
                              {player.rank === 1
                                ? "🎉 Winner!"
                                : player.rank === 2
                                ? "🥈 Runner-up"
                                : player.rank === 3
                                ? "🥉 Third place"
                                : "Great job!"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        {player.score}
                      </div>
                      <div className="text-white/70 text-sm">
                        {player.score === 1 ? "point" : "points"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-200 flex items-center"
              >
                <X className="w-5 h-5 mr-2" />
                Close
              </button>
              {isHost && (
                <button
                  onClick={() => {
                    setShowLeaderboard(false);
                    // Reset game state for new game
                    setQuestion(null);
                    setRoundId(null);
                    setAnswers([]);
                    setText("");
                    setVotedAnswers(new Set());
                  }}
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 flex items-center transform hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5 mr-2" />
                  New Game
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

/**
 * Session Timeline — MAX GRAPHICS MODE
 * Animated timeline showing recent study sessions with playback
 * Visualizes attempt sequences with correct/incorrect markers
 */

import { useState, useRef, useEffect } from 'react';
import { animate as anime } from "animejs";

interface SessionAttempt {
  sessionId: string;
  itemId: string;
  correct: boolean;
  tsSubmit: number;
}

interface SessionTimelineProps {
  attempts: SessionAttempt[];
  height?: number;
}

export function SessionTimeline({
  attempts,
  height = 400,
}: SessionTimelineProps) {
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Group by session
  const sessions = (() => {
    const grouped: Record<string, SessionAttempt[]> = {};
    attempts.forEach((attempt) => {
      if (!grouped[attempt.sessionId]) {
        grouped[attempt.sessionId] = [];
      }
      grouped[attempt.sessionId].push(attempt);
    });
    return Object.entries(grouped)
      .map(([sessionId, attempts]) => ({
        sessionId,
        attempts: attempts.sort((a, b) => a.tsSubmit - b.tsSubmit),
        correctCount: attempts.filter((a) => a.correct).length,
        totalCount: attempts.length,
        accuracy: attempts.filter((a) => a.correct).length / attempts.length,
        startTime: Math.min(...attempts.map((a) => a.tsSubmit)),
        endTime: Math.max(...attempts.map((a) => a.tsSubmit)),
      }))
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 5); // Latest 5 sessions
  })();

  useEffect(() => {
    if (isPlaying && playbackIndex < attempts.length) {
      const timer = setTimeout(() => {
        setPlaybackIndex((prev) => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    } else if (playbackIndex >= attempts.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, playbackIndex, attempts.length]);

  const handlePlayPause = () => {
    if (playbackIndex >= attempts.length) {
      setPlaybackIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
  };

  if (sessions.length === 0) {
    return (
      <div className="glow-card p-8 flex items-center justify-center text-center" style={{ height }}>
        <div>
          <div className="text-4xl mb-3">📅</div>
          <div className="text-slate-400 text-sm">No session data yet. Start studying to populate.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glow-card p-6 rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Session Timeline</h3>
          <p className="text-sm text-slate-400">Recent study sessions with playback</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:scale-105 transition-transform"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${(playbackIndex / attempts.length) * 100}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          {playbackIndex} / {attempts.length} attempts
        </div>
      </div>

      {/* Sessions */}
      <div ref={timelineRef} className="space-y-6" style={{ maxHeight: height, overflowY: 'auto' }}>
        {sessions.map((session, sessionIndex) => (
          <div key={session.sessionId} className="rounded-2xl p-5 bg-white/5 border border-white/10">
            {/* Session Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-white">
                  Session {sessions.length - sessionIndex}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {new Date(session.startTime).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  {((session.accuracy * 100).toFixed(0))}%
                </div>
                <div className="text-xs text-slate-400">
                  {session.correctCount}/{session.totalCount} correct
                </div>
              </div>
            </div>

            {/* Attempt Markers */}
            <div className="flex flex-wrap gap-2">
              {session.attempts.map((attempt, attemptIndex) => {
                const globalIndex = attempts.findIndex(
                  (a) => a.sessionId === attempt.sessionId && a.itemId === attempt.itemId
                );
                const isRevealed = globalIndex <= playbackIndex;

                return (
                  <div
                    key={attemptIndex}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      !isRevealed
                        ? 'bg-slate-700 text-slate-500'
                        : attempt.correct
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg'
                        : 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg'
                    }`}
                    style={{
                      transform: isRevealed ? 'scale(1)' : 'scale(0.9)',
                    }}
                  >
                    {isRevealed ? (attempt.correct ? '✓' : '✗') : '?'}
                  </div>
                );
              })}
            </div>

            {/* Duration */}
            <div className="mt-3 text-xs text-slate-500">
              Duration: {Math.round((session.endTime - session.startTime) / 60000)} min
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

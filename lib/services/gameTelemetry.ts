/**
 * Game Telemetry Service
 *
 * Tracks mini-game performance and logs to learner state
 */

import type { DifficultyLevel } from '../games/follow-the-money/types';

export interface GameSession {
  gameId: string;
  difficulty: DifficultyLevel;
  isCorrect: boolean;
  timeSeconds: number;
  xpGained: number;
  timestamp: number;
}

export interface GameStats {
  totalPlays: number;
  totalWins: number;
  winRate: number;
  averageTimeSeconds: number;
  totalXPGained: number;
  difficultyBreakdown: Record<DifficultyLevel, {
    plays: number;
    wins: number;
    winRate: number;
  }>;
}

/**
 * Log a game session to telemetry
 */
export async function logGameSession(
  learnerId: string,
  session: Omit<GameSession, 'timestamp'>
): Promise<void> {
  try {
    const payload = {
      ...session,
      timestamp: Date.now(),
    };

    // Store in learner state via API
    const response = await fetch('/api/game-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId,
        session: payload,
      }),
    });

    if (!response.ok) {
      console.error('[GameTelemetry] Failed to log session:', response.statusText);
    }
  } catch (error) {
    console.error('[GameTelemetry] Error logging session:', error);
  }
}

/**
 * Fetch game statistics for a learner
 */
export async function fetchGameStats(
  learnerId: string,
  gameId: string
): Promise<GameStats | null> {
  try {
    const response = await fetch(
      `/api/game-telemetry?learnerId=${encodeURIComponent(learnerId)}&gameId=${encodeURIComponent(gameId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.stats as GameStats;
  } catch (error) {
    console.error('[GameTelemetry] Error fetching stats:', error);
    return null;
  }
}

/**
 * Compute stats from raw sessions
 */
export function computeGameStats(sessions: GameSession[]): GameStats {
  if (sessions.length === 0) {
    return {
      totalPlays: 0,
      totalWins: 0,
      winRate: 0,
      averageTimeSeconds: 0,
      totalXPGained: 0,
      difficultyBreakdown: {
        easy: { plays: 0, wins: 0, winRate: 0 },
        medium: { plays: 0, wins: 0, winRate: 0 },
        hard: { plays: 0, wins: 0, winRate: 0 },
        expert: { plays: 0, wins: 0, winRate: 0 },
      },
    };
  }

  const totalPlays = sessions.length;
  const totalWins = sessions.filter(s => s.isCorrect).length;
  const winRate = (totalWins / totalPlays) * 100;
  const averageTimeSeconds =
    sessions.reduce((sum, s) => sum + s.timeSeconds, 0) / totalPlays;
  const totalXPGained = sessions.reduce((sum, s) => sum + s.xpGained, 0);

  // Difficulty breakdown
  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
  const difficultyBreakdown: Record<DifficultyLevel, { plays: number; wins: number; winRate: number }> = {
    easy: { plays: 0, wins: 0, winRate: 0 },
    medium: { plays: 0, wins: 0, winRate: 0 },
    hard: { plays: 0, wins: 0, winRate: 0 },
    expert: { plays: 0, wins: 0, winRate: 0 },
  };

  for (const difficulty of difficulties) {
    const sessionsAtDifficulty = sessions.filter(s => s.difficulty === difficulty);
    const plays = sessionsAtDifficulty.length;
    const wins = sessionsAtDifficulty.filter(s => s.isCorrect).length;
    difficultyBreakdown[difficulty] = {
      plays,
      wins,
      winRate: plays > 0 ? (wins / plays) * 100 : 0,
    };
  }

  return {
    totalPlays,
    totalWins,
    winRate,
    averageTimeSeconds,
    totalXPGained,
    difficultyBreakdown,
  };
}

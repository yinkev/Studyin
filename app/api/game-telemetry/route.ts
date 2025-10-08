/**
 * Game Telemetry API
 *
 * POST: Log game session
 * GET: Fetch game stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLearnerState, saveLearnerState } from '../../../lib/server/study-state';
import type { GameSession } from '../../../lib/services/gameTelemetry';
import { computeGameStats } from '../../../lib/services/gameTelemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { learnerId, session } = body as {
      learnerId: string;
      session: GameSession;
    };

    if (!learnerId || !session) {
      return NextResponse.json(
        { error: 'Missing learnerId or session data' },
        { status: 400 }
      );
    }

    // Load learner state
    const state = await loadLearnerState(learnerId);

    // Initialize miniGames if not present
    if (!(state as any).miniGames) {
      (state as any).miniGames = {};
    }

    // Initialize game array if not present
    if (!(state as any).miniGames[session.gameId]) {
      (state as any).miniGames[session.gameId] = [];
    }

    // Add session (keep last 100 sessions)
    (state as any).miniGames[session.gameId].push(session);
    (state as any).miniGames[session.gameId] = (state as any).miniGames[
      session.gameId
    ].slice(-100);

    // Update analytics: add XP to total study time proxy (games count as study time)
    if (!state.analytics) {
      state.analytics = {
        totalStudyTimeMs: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        lastWeekActivity: [0, 0, 0, 0, 0, 0, 0],
        sessionsCompleted: 0,
      };
    }

    // Add game session time to total study time
    state.analytics.totalStudyTimeMs += session.timeSeconds * 1000;
    state.analytics.sessionsCompleted += 1;

    // Update last week activity (track game plays)
    const now = Date.now();
    const today = Math.floor(now / (24 * 60 * 60 * 1000));
    const sessionDay = Math.floor(session.timestamp / (24 * 60 * 60 * 1000));
    const daysAgo = today - sessionDay;

    if (daysAgo >= 0 && daysAgo < 7) {
      state.analytics.lastWeekActivity[6 - daysAgo]++;
    }

    // Save state
    await saveLearnerState(learnerId, state);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GameTelemetry API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const learnerId = searchParams.get('learnerId');
    const gameId = searchParams.get('gameId');

    if (!learnerId || !gameId) {
      return NextResponse.json(
        { error: 'Missing learnerId or gameId' },
        { status: 400 }
      );
    }

    // Load learner state
    const state = await loadLearnerState(learnerId);

    // Get sessions for this game
    const sessions = ((state as any).miniGames?.[gameId] || []) as GameSession[];

    // Compute stats
    const stats = computeGameStats(sessions);

    return NextResponse.json({ stats, sessions });
  } catch (error) {
    console.error('[GameTelemetry API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

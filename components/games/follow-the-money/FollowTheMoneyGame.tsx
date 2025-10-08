'use client';

/**
 * Follow The Money - Main Game Component
 * Orchestrates game flow, state management, and animations
 */

import { useReducer, useRef, useEffect, useState } from 'react';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Button } from '@/components/ui/MD3Button';
import { animate } from 'motion/react';
import { GameBoard } from './GameBoard';
import { ResultsModal } from './ResultsModal';
import {
  gameReducer,
  createInitialState,
  startNewGame,
  processSelection,
} from '@/lib/games/follow-the-money/game-state';
import { generateGameSeed } from '@/lib/games/follow-the-money/shuffle-engine';
import {
  DIFFICULTY_CONFIGS,
  type DifficultyLevel,
} from '@/lib/games/follow-the-money/types';
import { useXP } from '@/components/XPProvider';
import { logGameSession } from '@/lib/services/gameTelemetry';

export function FollowTheMoneyGame() {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState());
  const [selectionTime, setSelectionTime] = useState<number>(0);
  const [selectStartTime, setSelectStartTime] = useState<number | null>(null);

  const { awardXPWithFeedback } = useXP();

  // Refs for shell elements (for animation)
  const shellRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Handle shell ref updates
  const handleShellRef = (index: number, element: HTMLDivElement | null) => {
    if (element) {
      shellRefs.current.set(index, element);
    } else {
      shellRefs.current.delete(index);
    }
  };

  // Start a new game
  const handleStartGame = (difficulty: DifficultyLevel) => {
    const seed = generateGameSeed();
    const newState = startNewGame(gameState, difficulty, seed);
    dispatch({ type: 'START_GAME', difficulty, seed });

    // Automatically start shuffling after brief delay
    setTimeout(() => {
      dispatch({ type: 'START_SHUFFLING', shuffleSequence: newState.shuffleSequence });
    }, 1500);
  };

  // Handle shell selection
  const handleShellSelect = (shellIndex: number) => {
    if (gameState.phase !== 'selecting' || !selectStartTime) return;

    const timeSeconds = (Date.now() - selectStartTime) / 1000;
    setSelectionTime(timeSeconds);

    const { newState, xpGained, reason } = processSelection(
      gameState,
      shellIndex,
      timeSeconds
    );

    dispatch({
      type: 'SELECT_SHELL',
      shellIndex,
    });

    // Reveal result after brief delay
    setTimeout(() => {
      dispatch({
        type: 'REVEAL_RESULT',
        isCorrect: newState.isCorrect!,
        xpGained,
      });

      // Award XP
      if (xpGained > 0) {
        awardXPWithFeedback(xpGained, reason);
      }

      // Log telemetry
      logGameSession('local-dev', {
        gameId: 'follow-the-money',
        difficulty: gameState.difficulty,
        isCorrect: newState.isCorrect!,
        timeSeconds: timeSeconds,
        xpGained,
      }).catch(err => {
        console.error('[FTM] Telemetry error:', err);
      });
    }, 500);
  };

  // Animate shuffles using Motion
  useEffect(() => {
    if (gameState.phase !== 'shuffling' || gameState.shuffleSequence.length === 0) {
      return;
    }

    const config = DIFFICULTY_CONFIGS[gameState.difficulty];
    const sequence = gameState.shuffleSequence;

    let hasAnimations = false;
    sequence.forEach((swap, index) => {
      const shellA = shellRefs.current.get(swap.a);
      const shellB = shellRefs.current.get(swap.b);

      if (!shellA || !shellB) return;

      hasAnimations = true;

      // Get current positions
      const posA = {
        x: parseFloat(shellA.style.left) || 0,
        y: parseFloat(shellA.style.top) || 0,
      };
      const posB = {
        x: parseFloat(shellB.style.left) || 0,
        y: parseFloat(shellB.style.top) || 0,
      };

      // Swap positions, starting both at the same delayed time
      const delaySec = (index * config.speed) / 1000;
      const durationSec = config.speed / 1000;
      const aAnim = animate(
        shellA as any,
        { left: posB.x, top: posB.y } as any,
        { duration: durationSec, delay: delaySec, easing: [0.45, 0, 0.55, 1] } as any
      );
      // Advance shuffle after A completes
      (Array.isArray(aAnim) ? Promise.all(aAnim.map(a => a.finished)) : aAnim.finished)
        .then(() => dispatch({ type: 'ADVANCE_SHUFFLE' }));

      animate(
        shellB as any,
        { left: posA.x, top: posA.y } as any,
        { duration: durationSec, delay: delaySec, easing: [0.45, 0, 0.55, 1] } as any
      );
    });

    // Only play and attach callback if we have animations
    if (hasAnimations) {
      const totalDuration = sequence.length * config.speed;

      setTimeout(() => {
        dispatch({ type: 'COMPLETE_SHUFFLING' });
        setSelectStartTime(Date.now());
      }, totalDuration);
    } else {
      // No animations, go straight to selecting
      dispatch({ type: 'COMPLETE_SHUFFLING' });
      setSelectStartTime(Date.now());
    }
    // No explicit cleanup needed; animations are time-bounded
  }, [gameState.phase, gameState.shuffleSequence, gameState.difficulty]);

  const showResults = gameState.phase === 'complete';

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <MD3Card className="backdrop-blur-xl" elevation={1}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text-high">
              Follow The Money
            </h1>
            <p className="text-text-med text-sm">
              Track the money bag through the shuffles!
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <span className="px-3 py-1 md3-primary-container md3-shape-medium text-xs font-semibold">
              Streak: {gameState.streak}
            </span>
            <span className="px-3 py-1 md3-primary-container md3-shape-medium text-xs font-semibold">
              Total XP: {gameState.totalXP}
            </span>
          </div>
        </div>
      </MD3Card>

      {/* Difficulty Selection (setup phase only) */}
      {gameState.phase === 'setup' && (
        <MD3Card className="backdrop-blur-xl" elevation={1}>
          <h2 className="text-xl font-bold text-text-high mb-4">
            Choose Difficulty
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]
            ).map((difficulty) => {
              const config = DIFFICULTY_CONFIGS[difficulty];
              return (
                <MD3Button
                  key={difficulty}
                  variant={gameState.difficulty === difficulty ? 'filled' : 'outlined'}
                  className="h-auto flex flex-col items-start p-4"
                  onClick={() => handleStartGame(difficulty)}
                >
                  <span className="font-bold capitalize">{difficulty}</span>
                  <span className="text-xs opacity-70">
                    {config.shells} shells · {config.shuffles} shuffles
                  </span>
                  <span className="text-xs opacity-70">
                    +{config.xpReward} XP
                  </span>
                </MD3Button>
              );
            })}
          </div>
        </MD3Card>
      )}

      {/* Game Board */}
      {gameState.phase !== 'setup' && (
        <MD3Card className="backdrop-blur-xl" elevation={1}>
          <GameBoard
            gameState={gameState}
            onShellSelect={handleShellSelect}
            onShellRef={handleShellRef}
          />
        </MD3Card>
      )}

      {/* Results Modal */}
      {showResults && (
        <ResultsModal
          gameState={gameState}
          selectionTime={selectionTime}
          onPlayAgain={() => handleStartGame(gameState.difficulty)}
          onChangeDifficulty={() => dispatch({ type: 'RESET_GAME' })}
        />
      )}
    </div>
  );
}

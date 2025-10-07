'use client';

/**
 * Follow The Money - Main Game Component
 * Orchestrates game flow, state management, and animations
 */

import { useReducer, useRef, useEffect, useState } from 'react';
import { Card, Button, Badge } from '@mantine/core';
import { createTimeline } from 'animejs';
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

  // Animate shuffles using Anime.js
  useEffect(() => {
    if (gameState.phase !== 'shuffling' || gameState.shuffleSequence.length === 0) {
      return;
    }

    const config = DIFFICULTY_CONFIGS[gameState.difficulty];
    const sequence = gameState.shuffleSequence;

    // Build timeline
    const tl = createTimeline({
      easing: 'easeInOutSine',
      autoplay: false,
    });

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

      // Swap positions
      tl
        .add(
          {
            targets: shellA,
            left: posB.x,
            top: posB.y,
            duration: config.speed,
            complete: () => {
              dispatch({ type: 'ADVANCE_SHUFFLE' });
            },
          },
          index * config.speed
        )
        .add(
          {
            targets: shellB,
            left: posA.x,
            top: posA.y,
            duration: config.speed,
          },
          index * config.speed // Same start time for simultaneous swap
        );
    });

    // Only play and attach callback if we have animations
    if (hasAnimations) {
      // Use complete callback instead of .finished promise
      const lastAnimation = sequence[sequence.length - 1];
      const totalDuration = sequence.length * config.speed;

      setTimeout(() => {
        dispatch({ type: 'COMPLETE_SHUFFLING' });
        setSelectStartTime(Date.now());
      }, totalDuration);

      // Play timeline
      tl.play();
    } else {
      // No animations, go straight to selecting
      dispatch({ type: 'COMPLETE_SHUFFLING' });
      setSelectStartTime(Date.now());
    }

    // Cleanup
    return () => {
      tl.pause();
    };
  }, [gameState.phase, gameState.shuffleSequence, gameState.difficulty]);

  const showResults = gameState.phase === 'complete';

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card className="bg-surface-bg2/90 backdrop-blur-xl border-2 border-primary/20" padding="lg">
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
            <Badge size="lg" variant="light" color="blue">
              Streak: {gameState.streak}
            </Badge>
            <Badge size="lg" variant="light" color="yellow">
              Total XP: {gameState.totalXP}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Difficulty Selection (setup phase only) */}
      {gameState.phase === 'setup' && (
        <Card className="bg-surface-bg2/90 backdrop-blur-xl" padding="lg">
          <h2 className="text-xl font-bold text-text-high mb-4">
            Choose Difficulty
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]
            ).map((difficulty) => {
              const config = DIFFICULTY_CONFIGS[difficulty];
              return (
                <Button
                  key={difficulty}
                  variant={
                    gameState.difficulty === difficulty ? 'filled' : 'outline'
                  }
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
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Game Board */}
      {gameState.phase !== 'setup' && (
        <Card className="bg-surface-bg2/90 backdrop-blur-xl" padding="lg">
          <GameBoard
            gameState={gameState}
            onShellSelect={handleShellSelect}
            onShellRef={handleShellRef}
          />
        </Card>
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

'use client';

/**
 * Follow The Money - GameBoard Component
 * Displays and manages shell layout with animations
 */

import { Shell } from './Shell';
import { type GameState, type ShellState } from '@/lib/games/follow-the-money/types';
import { useEffect, useState, useRef } from 'react';

interface GameBoardProps {
  /** Current game state */
  gameState: GameState;
  /** Handler for shell selection */
  onShellSelect: (index: number) => void;
  /** Ref callbacks for shell elements (for animation) */
  onShellRef?: (index: number, element: HTMLDivElement | null) => void;
}

/**
 * Calculate shell positions in a horizontal line
 * Mobile-first responsive layout
 */
function calculateShellPositions(
  shellCount: number,
  containerWidth: number
): Array<{ x: number; y: number }> {
  const shellWidth = containerWidth < 768 ? 96 : 128; // 24*4 or 32*4 (Tailwind w-24 or w-32)
  const gap = containerWidth < 768 ? 16 : 24;
  const totalWidth = shellCount * shellWidth + (shellCount - 1) * gap;
  const startX = (containerWidth - totalWidth) / 2;

  return Array.from({ length: shellCount }, (_, i) => ({
    x: startX + i * (shellWidth + gap),
    y: 0,
  }));
}

/**
 * Get shell visual state based on game phase and index
 */
function getShellState(
  gameState: GameState,
  shellIndex: number
): ShellState {
  const { phase, playerSelection, moneyPosition, isCorrect } = gameState;

  if (phase === 'shuffling') {
    return 'shuffling';
  }

  if (phase === 'selecting') {
    return 'idle';
  }

  if (phase === 'revealing' || phase === 'complete') {
    if (playerSelection === shellIndex) {
      return isCorrect ? 'revealed-correct' : 'revealed-wrong';
    }
    // Show correct shell if player was wrong
    if (shellIndex === moneyPosition && !isCorrect) {
      return 'revealed-correct';
    }
    return 'idle';
  }

  return 'idle';
}

export function GameBoard({
  gameState,
  onShellSelect,
  onShellRef,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shellPositions, setShellPositions] = useState<
    Array<{ x: number; y: number }>
  >([]);

  const shellCount =
    gameState.phase === 'setup'
      ? 3
      : gameState.shuffleSequence.length > 0
        ? Math.max(
            ...gameState.shuffleSequence.flatMap((s) => [s.a, s.b])
          ) + 1
        : 3;

  // Calculate positions on mount and resize
  useEffect(() => {
    const updatePositions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setShellPositions(calculateShellPositions(shellCount, width));
      }
    };

    updatePositions();

    const handleResize = () => {
      updatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [shellCount]);

  const isSelectable = gameState.phase === 'selecting';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 md:h-64 flex items-center justify-center"
      role="group"
      aria-label="Game shells"
    >
      {/* Shell grid */}
      {shellPositions.map((position, index) => (
        <Shell
          key={index}
          ref={(el) => onShellRef?.(index, el)}
          index={index}
          total={shellCount}
          state={getShellState(gameState, index)}
          hasMoney={index === gameState.moneyPosition}
          onClick={() => onShellSelect(index)}
          disabled={!isSelectable}
          position={position}
        />
      ))}

      {/* Initial money indicator (setup phase only) */}
      {gameState.phase === 'setup' && shellPositions[gameState.moneyPosition] && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: shellPositions[gameState.moneyPosition].x + 48, // Center of shell
            top: shellPositions[gameState.moneyPosition].y - 32,
          }}
        >
          <div className="animate-bounce text-4xl">💰</div>
        </div>
      )}

      {/* Status text */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-text-med"
        aria-live="polite"
        aria-atomic="true"
      >
        {gameState.phase === 'setup' && 'Watch the money bag!'}
        {gameState.phase === 'shuffling' && 'Follow the shuffle...'}
        {gameState.phase === 'selecting' && 'Pick a shell!'}
        {gameState.phase === 'revealing' && 'Revealing...'}
        {gameState.phase === 'complete' &&
          (gameState.isCorrect ? '🎉 Correct!' : '😔 Try again!')}
      </div>
    </div>
  );
}

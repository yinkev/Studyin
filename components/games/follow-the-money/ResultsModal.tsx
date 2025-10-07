'use client';

/**
 * Follow The Money - Results Modal
 * Shows game outcome and XP earned
 */

import { Modal, Button, Group } from '@mantine/core';
import { type GameState } from '@/lib/games/follow-the-money/types';
import { computeRoundXP } from '@/lib/games/follow-the-money/scoring';
import { motion } from 'framer-motion';

interface ResultsModalProps {
  gameState: GameState;
  selectionTime: number;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
}

export function ResultsModal({
  gameState,
  selectionTime,
  onPlayAgain,
  onChangeDifficulty,
}: ResultsModalProps) {
  const { isCorrect, difficulty, streak, playerSelection, moneyPosition } =
    gameState;

  const { total: xpEarned, reason } = computeRoundXP(
    difficulty,
    Math.max(0, streak - 1), // Use previous streak for calculation
    selectionTime,
    isCorrect!
  );

  return (
    <Modal
      opened={true}
      onClose={() => {}}
      closeOnClickOutside={false}
      withCloseButton={false}
      size="lg"
      centered
      className="bg-surface-bg2/95 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="text-center mb-4"
      >
        {isCorrect ? (
          <div className="text-6xl mb-2">🎉</div>
        ) : (
          <div className="text-6xl mb-2">😔</div>
        )}
        <h2 className="text-2xl font-bold text-text-high">
          {isCorrect ? 'Correct!' : 'Not Quite!'}
        </h2>
      </motion.div>

      <div className="text-center space-y-4">
          {/* Result details */}
          <div className="bg-surface-bg1 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-med">Your choice:</span>
              <span className="text-text-high font-semibold">
                Shell {(playerSelection ?? 0) + 1}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-med">Correct shell:</span>
              <span className="text-text-high font-semibold">
                Shell {moneyPosition + 1}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-med">Time:</span>
              <span className="text-text-high font-semibold">
                {selectionTime.toFixed(2)}s
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-med">Difficulty:</span>
              <span className="text-text-high font-semibold capitalize">
                {difficulty}
              </span>
            </div>
          </div>

          {/* XP Earned */}
          {isCorrect && xpEarned > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-warning/20 to-success/20 rounded-lg p-6"
            >
              <div className="text-4xl font-extrabold text-warning mb-2">
                +{xpEarned} XP
              </div>
              <div className="text-xs text-text-med">{reason}</div>
            </motion.div>
          )}

          {/* Streak info */}
          <div className="text-sm text-text-med">
            {isCorrect ? (
              <span>
                🔥 Streak: <span className="text-warning font-bold">{streak}</span>
              </span>
            ) : (
              <span className="text-danger">Streak reset</span>
            )}
          </div>
        </div>

        <Group justify="center" mt="xl">
          <Button color="blue" variant="filled" onClick={onPlayAgain}>
            Play Again ({difficulty})
          </Button>
          <Button color="gray" variant="outline" onClick={onChangeDifficulty}>
            Change Difficulty
          </Button>
        </Group>
    </Modal>
  );
}

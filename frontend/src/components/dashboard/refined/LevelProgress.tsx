/**
 * LevelProgress - Clean level and XP progress display
 */

import { motion } from 'motion/react';
import { Award, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LevelProgressProps {
  level: number;
  currentXP: number;
  targetXP: number;
  masteryPercent: number;
}

export function LevelProgress({
  level,
  currentXP,
  targetXP,
  masteryPercent
}: LevelProgressProps) {
  const xpProgress = Math.min((currentXP / targetXP) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center relative overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-primary/5"></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-3xl font-black text-primary">{level}</span>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                  LEVEL
                </span>
              </div>
            </div>
          </motion.div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Level {level}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Mastery Badge */}
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">
              {masteryPercent}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Overall Mastery</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress to Level {level + 1}</span>
          <span className="font-mono">{Math.round(xpProgress)}%</span>
        </div>
        <div className="relative">
          <div className="h-3 bg-background/50 rounded-full overflow-hidden border border-border-subtle">
            <motion.div
              className="h-full bg-primary relative"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Milestone */}
      {xpProgress >= 75 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-success"
        >
          <Award className="w-4 h-4" />
          <span className="font-medium">Almost there! Keep going!</span>
        </motion.div>
      )}
    </div>
  );
}

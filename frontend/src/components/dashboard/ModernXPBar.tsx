/**
 * ModernXPBar - Gradient-free XP progress indicator
 * Uses solid colors + shine animation for visual interest
 */

import { motion, useSpring, useTransform, Variants } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export interface ModernXPBarProps {
  currentXP: number;
  targetXP: number;
  level: number;
  className?: string;
}

export function ModernXPBar({ currentXP, targetXP, level, className }: ModernXPBarProps) {
  const progress = Math.min((currentXP / Math.max(targetXP, 1)) * 100, 100);
  const springProgress = useSpring(progress, { stiffness: 100, damping: 20 });
  const displayWidth = useTransform(springProgress, (v: number) => `${v}%`);

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
            >
              <Zap className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Experience</p>
              <p className="text-xl font-bold">
                {currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-black text-primary">{Math.round(progress)}%</p>
            <p className="text-xs text-muted-foreground">to Level {level + 1}</p>
          </div>
        </div>

        {/* NO GRADIENT - Solid color progress bar */}
        <div className="relative h-3 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: displayWidth }}
          />

          {/* Shine effect without gradients */}
          <motion.div
            className="absolute inset-0 bg-white/20"
            style={{
              clipPath: 'polygon(0 0, 20% 0, 30% 100%, 10% 100%)'
            }}
            animate={{ x: ['-100%', '300%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>

        <p className="mt-2 text-xs text-center text-muted-foreground">
          {targetXP - currentXP} XP remaining
        </p>
      </CardContent>
    </Card>
  );
}

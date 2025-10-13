/**
 * ModernStreakCard - Streak counter with NO GRADIENTS
 * Uses solid colors + animations for visual feedback
 */

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModernStreakCardProps {
  streak: number;
  bestStreak: number;
  lastCheckIn?: string | null;
  className?: string;
}

export function ModernStreakCard({ streak, bestStreak, lastCheckIn, className }: ModernStreakCardProps) {
  const isActive = lastCheckIn
    ? (new Date().getTime() - new Date(lastCheckIn).getTime()) < 48 * 60 * 60 * 1000
    : false;

  return (
    <Card className={cn("glass h-full", isActive && "border-secondary border-2", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            animate={isActive ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              isActive ? "bg-secondary/20" : "bg-neutral-200 dark:bg-neutral-800"
            )}
          >
            <Flame className={cn("w-8 h-8", isActive ? "text-secondary" : "text-neutral-400")} />
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                {isActive ? "🔥 ACTIVE" : "💤 AT RISK"}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{streak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>

            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Best: {bestStreak} days
            </p>

            {!isActive && streak > 0 && (
              <p className="text-xs font-medium text-destructive mt-2">
                ⚠️ Streak at risk! Study today to keep your {streak}-day progress.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

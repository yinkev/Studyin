/**
 * LevelCard - User level display with mastery progress
 * NO GRADIENTS - solid colors only
 */

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LevelCardProps {
  level: number;
  masteryPercent: number;
  className?: string;
}

export function LevelCard({ level, masteryPercent, className }: LevelCardProps) {
  return (
    <Card className={cn("glass border-2 border-accent/30 h-full", className)}>
      <CardContent className="p-6 text-center">
        <Badge variant="outline" className="mb-3">Medical Student</Badge>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-accent/10 mb-3"
        >
          <Award className="w-12 h-12 text-accent" />
        </motion.div>

        <p className="text-5xl font-black mb-1">{level}</p>
        <p className="text-sm text-muted-foreground mb-3">Current Level</p>

        {/* NO GRADIENT - Solid color progress */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${masteryPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{Math.round(masteryPercent)}% Mastery</p>
      </CardContent>
    </Card>
  );
}

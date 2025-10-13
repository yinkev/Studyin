/**
 * CosmicLevelCard - Large level display with circular mastery rings
 * NO GRADIENTS - solid colors with glow effects
 */

import { motion } from 'motion/react';
import { Star, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from './CircularProgress';
import { cn } from '@/lib/utils';

interface CosmicLevelCardProps {
  level: number;
  currentXP: number;
  targetXP: number;
  masteryPercent: number;
  className?: string;
}

export function CosmicLevelCard({
  level,
  currentXP,
  targetXP,
  masteryPercent,
  className
}: CosmicLevelCardProps) {
  const xpProgress = Math.min((currentXP / targetXP) * 100, 100);

  return (
    <Card className={cn('glass-purple glow-primary', className)}>
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge
            variant="outline"
            className="bg-stardust/20 text-stardust border-stardust/30 text-xs font-bold tracking-wider"
          >
            WELCOME BACK, EXPLORER
          </Badge>
        </motion.div>

        {/* Level display */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="relative inline-flex items-center justify-center">
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'loop'
              }}
              style={{
                filter: 'blur(20px)'
              }}
            />

            {/* Level number */}
            <div className="relative z-10 w-32 h-32 rounded-full bg-background/50 border-4 border-primary flex flex-col items-center justify-center glow-primary">
              <Sparkles className="w-6 h-6 text-stardust mb-1" />
              <span className="text-4xl font-black text-primary">
                {level}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                LEVEL
              </span>
            </div>
          </div>
        </motion.div>

        {/* XP Progress */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>XP Progress</span>
            <span className="font-mono">
              {currentXP.toLocaleString()} / {targetXP.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-background/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary glow-primary"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>

        {/* Mastery indicator */}
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-stardust" />
          <span className="text-muted-foreground">
            Overall Mastery:
          </span>
          <span className="font-bold text-primary">
            {masteryPercent}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkillMasteryRings({
  skills
}: {
  skills: Array<{ name: string; mastery: number; color?: 'primary' | 'secondary' | 'accent' }>;
}) {
  return (
    <Card className="glass">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-stardust" />
          Skill Mastery
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <CircularProgress
                value={skill.mastery}
                size={100}
                strokeWidth={6}
                color={skill.color || 'primary'}
                showPercentage
              />
              <p className="text-xs font-medium text-muted-foreground mt-2 text-center">
                {skill.name}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

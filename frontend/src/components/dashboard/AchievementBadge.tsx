/**
 * AchievementBadge - Cosmic achievement badge with glow effects
 * NO GRADIENTS - solid colors with layered glows
 */

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Achievement {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number; // 0-100 if in progress
}

const rarityStyles = {
  common: {
    glass: 'glass',
    glow: '',
    badgeColor: 'bg-neutral-300 text-neutral-700'
  },
  rare: {
    glass: 'glass-blue',
    glow: 'glow-secondary',
    badgeColor: 'bg-secondary/20 text-secondary'
  },
  epic: {
    glass: 'glass-purple',
    glow: 'glow-primary',
    badgeColor: 'bg-primary/20 text-primary'
  },
  legendary: {
    glass: 'glass-pink',
    glow: 'glow-aurora',
    badgeColor: 'bg-aurora/20 text-aurora'
  }
};

interface AchievementBadgeProps {
  achievement: Achievement;
  onClick?: () => void;
  className?: string;
}

export function AchievementBadge({ achievement, onClick, className }: AchievementBadgeProps) {
  const styles = rarityStyles[achievement.rarity];
  const Icon = achievement.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={className}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300',
          styles.glass,
          achievement.unlocked && styles.glow,
          !achievement.unlocked && 'opacity-50 grayscale'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
          {/* Icon */}
          <motion.div
            className={cn(
              'relative p-4 rounded-full',
              achievement.unlocked
                ? 'bg-background/50'
                : 'bg-neutral-300/10'
            )}
            animate={
              achievement.unlocked
                ? {
                    boxShadow: [
                      '0 0 0px rgba(255,255,255,0)',
                      '0 0 20px rgba(255,255,255,0.2)',
                      '0 0 0px rgba(255,255,255,0)'
                    ]
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: achievement.unlocked ? Infinity : 0,
              repeatType: 'loop'
            }}
          >
            <Icon
              className={cn(
                'w-8 h-8',
                achievement.unlocked
                  ? achievement.rarity === 'legendary'
                    ? 'text-aurora'
                    : achievement.rarity === 'epic'
                    ? 'text-primary'
                    : achievement.rarity === 'rare'
                    ? 'text-secondary'
                    : 'text-accent'
                  : 'text-muted-foreground'
              )}
            />
          </motion.div>

          {/* Title */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">
              {achievement.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {achievement.description}
            </p>
          </div>

          {/* Rarity Badge */}
          <Badge className={cn('text-xs', styles.badgeColor)} variant="outline">
            {achievement.rarity.toUpperCase()}
          </Badge>

          {/* Progress bar if in progress */}
          {!achievement.unlocked && achievement.progress !== undefined && (
            <div className="w-full mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{achievement.progress}%</span>
              </div>
              <div className="h-1.5 bg-neutral-300/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Unlock date */}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AchievementGrid({
  achievements,
  onAchievementClick
}: {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <AchievementBadge
            achievement={achievement}
            onClick={() => onAchievementClick?.(achievement)}
          />
        </motion.div>
      ))}
    </div>
  );
}

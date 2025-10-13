/**
 * QuestCard - Daily quests and missions with cosmic styling
 * NO GRADIENTS - solid colors with glassmorphism
 */

import { motion } from 'motion/react';
import { LucideIcon, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: 'daily' | 'weekly' | 'main';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  progress: number; // 0-100
  completed: boolean;
  completedAt?: string;
}

const typeStyles = {
  daily: {
    badge: 'bg-secondary/20 text-secondary border-secondary/30',
    color: 'text-secondary'
  },
  weekly: {
    badge: 'bg-primary/20 text-primary border-primary/30',
    color: 'text-primary'
  },
  main: {
    badge: 'bg-aurora/20 text-aurora border-aurora/30',
    color: 'text-aurora'
  }
};

const difficultyStars = {
  easy: 1,
  medium: 2,
  hard: 3
};

interface QuestCardProps {
  quest: Quest;
  onToggle?: (questId: string) => void;
  className?: string;
}

export function QuestCard({ quest, onToggle, className }: QuestCardProps) {
  const styles = typeStyles[quest.type];
  const Icon = quest.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={className}
    >
      <Card
        className={cn(
          'glass cursor-pointer transition-all duration-300',
          quest.completed && 'opacity-60 border-accent/40'
        )}
        onClick={() => onToggle?.(quest.id)}
      >
        <CardContent className="p-4 flex gap-4">
          {/* Checkbox */}
          <motion.button
            className="flex-shrink-0 mt-1"
            whileTap={{ scale: 0.9 }}
            aria-label={quest.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {quest.completed ? (
              <CheckCircle2 className="w-6 h-6 text-accent" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground hover:text-accent transition-colors" />
            )}
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-1.5 rounded-md bg-background/50',
                    styles.color
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h4
                  className={cn(
                    'font-semibold text-sm',
                    quest.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {quest.title}
                </h4>
              </div>

              <Badge className={cn('text-xs shrink-0', styles.badge)} variant="outline">
                +{quest.xpReward} XP
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {quest.description}
            </p>

            {/* Progress */}
            {!quest.completed && quest.progress > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{quest.progress}%</span>
                </div>
                <Progress value={quest.progress} className="h-1.5" />
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {quest.type.charAt(0).toUpperCase() + quest.type.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: difficultyStars[quest.difficulty] }).map((_, i) => (
                  <span key={i} className="text-stardust">★</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function QuestList({
  quests,
  onToggleQuest
}: {
  quests: Quest[];
  onToggleQuest?: (questId: string) => void;
}) {
  const completedCount = quests.filter((q) => q.completed).length;
  const totalXP = quests
    .filter((q) => q.completed)
    .reduce((sum, q) => sum + q.xpReward, 0);

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Daily Quests</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{quests.length} Complete
            </Badge>
            {totalXP > 0 && (
              <Badge variant="outline" className="text-xs text-stardust border-stardust/30">
                +{totalXP} XP Earned
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} onToggle={onToggleQuest} />
        ))}
      </CardContent>
    </Card>
  );
}

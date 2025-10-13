/**
 * MilestonePath - Cosmic winding path with milestone nodes
 * NO GRADIENTS - SVG path with solid colors and glow effects
 */

import { motion } from 'motion/react';
import { LucideIcon, Star, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  status: 'completed' | 'current' | 'locked';
  level: number;
  xp: number;
  completedAt?: string;
}

interface MilestonePathProps {
  milestones: Milestone[];
  className?: string;
}

export function MilestonePath({ milestones, className }: MilestonePathProps) {
  return (
    <Card className={cn('glass', className)}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Star className="w-5 h-5 text-stardust" />
          Learning Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {/* SVG Path - NO GRADIENTS */}
        <svg
          className="absolute top-0 left-8 w-1 h-full"
          style={{ overflow: 'visible' }}
        >
          <motion.path
            d={`M 0 20 ${milestones.map((_, i) => `L 0 ${80 + i * 140}`).join(' ')}`}
            stroke="var(--color-primary-500)"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
            opacity={0.3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </svg>

        {/* Milestones */}
        <div className="relative space-y-8">
          {milestones.map((milestone, index) => (
            <MilestoneNode
              key={milestone.id}
              milestone={milestone}
              index={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneNode({ milestone, index }: { milestone: Milestone; index: number }) {
  const Icon = milestone.icon || Star;

  const statusStyles = {
    completed: {
      icon: CheckCircle2,
      iconColor: 'text-accent',
      bg: 'bg-accent/20',
      border: 'border-accent/40',
      glow: 'glow-accent'
    },
    current: {
      icon: Icon,
      iconColor: 'text-primary',
      bg: 'bg-primary/20',
      border: 'border-primary/40',
      glow: 'glow-primary'
    },
    locked: {
      icon: Lock,
      iconColor: 'text-muted-foreground',
      bg: 'bg-neutral-300/10',
      border: 'border-neutral-300/20',
      glow: ''
    }
  };

  const styles = statusStyles[milestone.status];
  const StatusIcon = styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex items-start gap-4 relative"
    >
      {/* Icon node */}
      <motion.div
        className={cn(
          'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2',
          styles.bg,
          styles.border,
          milestone.status === 'current' && styles.glow
        )}
        whileHover={{ scale: 1.1 }}
        animate={
          milestone.status === 'current'
            ? {
                boxShadow: [
                  '0 0 0px rgba(255,255,255,0)',
                  '0 0 24px var(--primary)',
                  '0 0 0px rgba(255,255,255,0)'
                ]
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: milestone.status === 'current' ? Infinity : 0,
          repeatType: 'loop'
        }}
      >
        <StatusIcon className={cn('w-6 h-6', styles.iconColor)} />
      </motion.div>

      {/* Content */}
      <div className="flex-1 pt-1.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={cn(
            'font-semibold text-sm',
            milestone.status === 'locked' && 'text-muted-foreground'
          )}>
            {milestone.title}
          </h4>
          <Badge
            variant="outline"
            className={cn(
              'text-xs shrink-0',
              milestone.status === 'completed' && 'bg-accent/10 text-accent border-accent/30',
              milestone.status === 'current' && 'bg-primary/10 text-primary border-primary/30',
              milestone.status === 'locked' && 'bg-neutral-300/5 text-muted-foreground border-neutral-300/20'
            )}
          >
            Level {milestone.level}
          </Badge>
        </div>

        <p className={cn(
          'text-xs mb-2',
          milestone.status === 'locked' ? 'text-muted-foreground/60' : 'text-muted-foreground'
        )}>
          {milestone.description}
        </p>

        <div className="flex items-center gap-3 text-xs">
          <span className={cn(
            'font-medium',
            milestone.status === 'completed' && 'text-accent',
            milestone.status === 'current' && 'text-primary',
            milestone.status === 'locked' && 'text-muted-foreground'
          )}>
            {milestone.xp} XP
          </span>

          {milestone.status === 'completed' && milestone.completedAt && (
            <span className="text-muted-foreground/70">
              Completed {new Date(milestone.completedAt).toLocaleDateString()}
            </span>
          )}

          {milestone.status === 'current' && (
            <Badge variant="secondary" className="text-xs">
              In Progress
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MilestoneTracker({ milestones }: { milestones: Milestone[] }) {
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const total = milestones.length;
  const progress = (completed / total) * 100;

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <Card className="glass-purple">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Journey Progress</h3>
            <span className="text-xs text-muted-foreground">
              {completed} / {total} Milestones
            </span>
          </div>
          <div className="h-2 bg-background/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary glow-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Milestone path */}
      <MilestonePath milestones={milestones} />
    </div>
  );
}

/**
 * CelebrationModal - Achievement unlocked celebration
 * NO GRADIENTS - particle effects with solid colors
 */

import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Achievement } from './AchievementBadge';
import { cn } from '@/lib/utils';

interface CelebrationModalProps {
  achievement: Achievement | null;
  open: boolean;
  onClose: () => void;
}

const rarityColors = {
  common: 'text-neutral-400',
  rare: 'text-secondary',
  epic: 'text-primary',
  legendary: 'text-aurora'
};

export function CelebrationModal({ achievement, open, onClose }: CelebrationModalProps) {
  if (!achievement) return null;

  const Icon = achievement.icon;
  const colorClass = rarityColors[achievement.rarity];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-purple border-primary/30 max-w-md overflow-hidden">
        {/* Animated particles */}
        <Particles />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="text-center pt-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
            className="mx-auto mb-4"
          >
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-3 py-1',
                achievement.rarity === 'legendary' && 'bg-aurora/20 text-aurora border-aurora/30',
                achievement.rarity === 'epic' && 'bg-primary/20 text-primary border-primary/30',
                achievement.rarity === 'rare' && 'bg-secondary/20 text-secondary border-secondary/30',
                achievement.rarity === 'common' && 'bg-neutral-400/20 text-neutral-400 border-neutral-400/30'
              )}
            >
              {achievement.rarity.toUpperCase()}
            </Badge>
          </motion.div>

          <DialogTitle className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-stardust" />
            Achievement Unlocked!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Icon with glow effect */}
          <motion.div
            className={cn(
              'relative p-8 rounded-full bg-background/50',
              achievement.rarity === 'legendary' && 'glow-aurora',
              achievement.rarity === 'epic' && 'glow-primary',
              achievement.rarity === 'rare' && 'glow-secondary'
            )}
            animate={{
              boxShadow: [
                '0 0 0px rgba(255,255,255,0)',
                '0 0 40px rgba(255,255,255,0.3)',
                '0 0 0px rgba(255,255,255,0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          >
            <Icon className={cn('w-16 h-16', colorClass)} />
          </motion.div>

          {/* Title & Description */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {achievement.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Rarity</p>
              <p className={cn('font-bold', colorClass)}>
                {achievement.rarity}
              </p>
            </div>
            {achievement.unlockedAt && (
              <div className="text-center">
                <p className="text-muted-foreground">Unlocked</p>
                <p className="font-bold">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 glow-primary"
            size="lg"
          >
            Continue Learning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Particles() {
  const particles = Array.from({ length: 20 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: [
              'var(--primary)',
              'var(--secondary)',
              'var(--accent)',
              'var(--aurora)',
              'var(--stardust)'
            ][Math.floor(Math.random() * 5)]
          }}
          initial={{
            opacity: 0,
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200
          }}
          transition={{
            duration: 2,
            delay: i * 0.05,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      ))}
    </div>
  );
}

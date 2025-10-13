/**
 * FlowStateCard - Psychology-driven flow state indicator
 * Based on Csíkszentmihályi's Flow Theory
 */

import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlowState {
  skill: number;
  challenge: number;
  balance: number;
  state: 'flow' | 'anxiety' | 'boredom' | 'apathy';
}

export interface FlowStateCardProps {
  flowState: FlowState;
  className?: string;
}

const stateConfig = {
  flow: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    label: '🎯 Flow State',
    guidance: 'Perfect! Keep studying at this difficulty level.'
  },
  anxiety: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    label: '😰 Anxiety',
    guidance: 'Challenge too high. Review fundamentals or use AI Coach for help.'
  },
  boredom: {
    bg: 'bg-neutral-200',
    text: 'text-neutral-600',
    label: '😴 Boredom',
    guidance: 'Too easy! Try harder questions or new topics to stay engaged.'
  },
  apathy: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-500',
    label: '😐 Apathy',
    guidance: 'Add more materials and practice regularly to build momentum.'
  }
};

export function FlowStateCard({ flowState, className }: FlowStateCardProps) {
  const current = stateConfig[flowState.state];

  return (
    <Card className={cn("glass h-full", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold">Flow State</p>
        </div>

        <div className={cn("p-4 rounded-xl mb-3", current.bg)}>
          <p className={cn("text-lg font-bold", current.text)}>{current.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Skill-Challenge Balance: {flowState.balance}%
          </p>
          <p className="text-xs font-medium mt-2 text-foreground/80">
            💡 {current.guidance}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Skill</span>
            <span className="font-semibold">{flowState.skill}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Challenge</span>
            <span className="font-semibold">{flowState.challenge}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

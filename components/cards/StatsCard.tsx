'use client';

import { BentoCard } from '../layout/BentoCard';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md';
}

export function StatsCard({
  icon,
  value,
  label,
  trend,
  trendValue,
  accent = 'primary',
  size = 'sm',
}: StatsCardProps) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;
  const trendColor = trend === 'up'
    ? 'text-semantic-success'
    : trend === 'down'
    ? 'text-semantic-danger'
    : 'text-text-med';

  return (
    <BentoCard size={size} accent={accent} interactive>
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-3xl font-extrabold text-text-high mb-1 tabular-nums">
            {value}
          </p>
          <p className="text-xs text-text-med font-medium">{label}</p>
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-semibold', trendColor)}>
              <span>{trendIcon}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 p-3 rounded-xl" style={{ background: 'var(--brand-primary-alpha-10, rgba(96, 165, 250, 0.1))' }}>
          {icon}
        </div>
      </div>
    </BentoCard>
  );
}

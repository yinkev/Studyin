/**
 * CircularProgress - Cosmic themed circular progress indicator
 * NO GRADIENTS - uses solid colors with glow effects
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;  // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'aurora' | 'stardust';
  showPercentage?: boolean;
  className?: string;
}

const colorMap = {
  primary: {
    stroke: 'var(--primary)',
    glow: 'var(--glow-primary)',
    text: 'text-primary'
  },
  secondary: {
    stroke: 'var(--secondary)',
    glow: 'var(--glow-secondary)',
    text: 'text-secondary'
  },
  accent: {
    stroke: 'var(--accent)',
    glow: 'var(--glow-accent)',
    text: 'text-accent'
  },
  aurora: {
    stroke: 'var(--aurora)',
    glow: 'var(--glow-aurora)',
    text: 'text-aurora'
  },
  stardust: {
    stroke: 'var(--stardust)',
    glow: 'var(--glow-stardust)',
    text: 'text-stardust'
  }
};

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color = 'primary',
  showPercentage = true,
  className
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  const colors = colorMap[color];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-neutral-300)"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
        />

        {/* Progress circle with glow */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            filter: `drop-shadow(${colors.glow})`
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.div
            className={cn('text-2xl font-bold tabular-nums', colors.text)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {Math.round(value)}%
          </motion.div>
        )}
        {label && (
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {label}
          </div>
        )}
        {sublabel && (
          <div className="text-[10px] text-muted-foreground/70">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

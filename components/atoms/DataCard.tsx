'use client';

/**
 * DataCard — Modern, Compact, Data-Dense Component
 * Sleek card for displaying metrics, stats, and information
 * INFJ: Minimalist but information-rich
 */

import { ReactNode } from 'react';

interface DataCardProps {
  /** Card title */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Main content */
  children: ReactNode;
  /** Accent color (trust/mastery/analysis) */
  accent?: 'trust' | 'mastery' | 'analysis';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Enable hover lift effect */
  hover?: boolean;
  /** Additional classes */
  className?: string;
}

const accentColors = {
  trust: 'border-accent-trust/20 hover:border-accent-trust/40',
  mastery: 'border-accent-mastery/20 hover:border-accent-mastery/40',
  analysis: 'border-accent-analysis/20 hover:border-accent-analysis/40',
};

const sizeClasses = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function DataCard({
  title,
  subtitle,
  children,
  accent,
  size = 'sm',
  hover = true,
  className = '',
}: DataCardProps) {
  return (
    <div
      className={`
        rounded-lg bg-secondary/10 border border-default/30
        transition-all duration-200
        ${sizeClasses[size]}
        ${hover ? 'hover-lift' : ''}
        ${accent ? accentColors[accent] : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-2">
          {title && (
            <h3 className="text-[10px] uppercase font-bold text-tertiary tracking-wide mb-0.5">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-secondary leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

/**
 * StatDisplay — Compact numeric stat with label
 */
interface StatDisplayProps {
  value: string | number;
  label: string;
  /** Accent color */
  accent?: 'trust' | 'mastery' | 'analysis';
  /** Show trend indicator */
  trend?: 'up' | 'down';
}

export function StatDisplay({ value, label, accent, trend }: StatDisplayProps) {
  const accentClass = accent
    ? `accent-${accent}`
    : 'text-primary';

  return (
    <div className="stat-compact">
      <div className={`stat-compact-value ${accentClass} flex items-center gap-1`}>
        {value}
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-success' : 'text-error'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="stat-compact-label">{label}</div>
    </div>
  );
}

/**
 * MetricRow — Compact key-value pair display
 */
interface MetricRowProps {
  label: string;
  value: ReactNode;
  /** Show separator line */
  separator?: boolean;
}

export function MetricRow({ label, value, separator = true }: MetricRowProps) {
  return (
    <div className={`flex items-center justify-between text-xs ${separator ? 'border-b border-default/20 pb-1.5 mb-1.5' : ''}`}>
      <span className="text-tertiary">{label}</span>
      <span className="font-semibold text-secondary tabular-nums">{value}</span>
    </div>
  );
}

export default DataCard;

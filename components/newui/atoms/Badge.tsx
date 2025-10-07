import { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-bg2/70 text-text-high border border-text-low/20',
  success: 'bg-semantic-success/15 text-semantic-success border border-semantic-success/30',
  warning: 'bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30',
  danger: 'bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30',
  info: 'bg-semantic-info/15 text-semantic-info border border-semantic-info/30',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
};

export function Badge({ variant = 'default', size = 'md', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
}

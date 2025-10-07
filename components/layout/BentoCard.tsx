'use client';

import { ReactNode, forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  accent?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  interactive?: boolean;
  loading?: boolean;
  gridArea?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'col-span-1 md:col-span-3 lg:col-span-3 row-span-2',
  sm: 'col-span-1 md:col-span-4 lg:col-span-4 row-span-2',
  md: 'col-span-1 md:col-span-4 lg:col-span-4 row-span-4',
  lg: 'col-span-1 md:col-span-4 lg:col-span-8 xl:col-span-8 row-span-4',
  xl: 'col-span-1 md:col-span-4 lg:col-span-8 xl:col-span-8 row-span-6',
  full: 'col-span-1 md:col-span-4 lg:col-span-8 xl:col-span-12 row-span-auto',
};

const accentClasses = {
  primary: 'border-brand-primary/20 hover:border-brand-primary',
  secondary: 'border-brand-secondary/20 hover:border-brand-secondary',
  success: 'border-semantic-success/20 hover:border-semantic-success',
  warning: 'border-semantic-warning/20 hover:border-semantic-warning',
  danger: 'border-semantic-danger/20 hover:border-semantic-danger',
};

export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  (
    {
      children,
      size = 'md',
      accent,
      interactive = false,
      loading = false,
      gridArea,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bento-card',
          'clinical-card',
          'relative overflow-hidden',
          sizeClasses[size],
          accent && accentClasses[accent],
          interactive && 'cursor-pointer bento-card-interactive',
          loading && 'animate-pulse',
          className
        )}
        style={{
          gridArea: gridArea || undefined,
        }}
        {...props}
      >
        {loading ? (
          <div className="bento-skeleton h-full w-full rounded-lg" />
        ) : (
          children
        )}
      </div>
    );
  }
);

BentoCard.displayName = 'BentoCard';

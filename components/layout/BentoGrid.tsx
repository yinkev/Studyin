'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  layout?: 'dashboard' | 'analytics' | 'learning-hub' | 'custom';
  stagger?: boolean;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapSizes = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function BentoGrid({
  children,
  layout = 'dashboard',
  stagger = true,
  gap = 'md',
  className,
}: BentoGridProps) {
  return (
    <div
      className={cn(
        'bento-grid',
        'grid w-full',
        'grid-cols-1',
        'md:grid-cols-4',
        'lg:grid-cols-8',
        'xl:grid-cols-12',
        gapSizes[gap],
        'auto-rows-[minmax(140px,auto)]',
        stagger && 'bento-stagger',
        className
      )}
      data-layout={layout}
    >
      {children}
    </div>
  );
}

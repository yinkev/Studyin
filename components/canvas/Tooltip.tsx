'use client';

import React from 'react';
import { cn } from '../ui/utils';

export function Tooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground shadow'
      )}
      style={{ left: x + 12, top: y + 12 }}
      role="tooltip"
    >
      {children}
    </div>
  );
}


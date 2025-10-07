'use client';

import * as React from 'react';
import { Tooltip as TooltipRoot, TooltipContent, TooltipTrigger } from '../ui/radix/tooltip';

export function Tooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <TooltipRoot open>
      <TooltipTrigger asChild>
        <span
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`,
            width: 1,
            height: 1,
            pointerEvents: 'none'
          }}
        />
      </TooltipTrigger>
      <TooltipContent
        forceMount
        side="top"
        align="start"
        sideOffset={0}
        className="pointer-events-none fixed z-50 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-slate-100 shadow"
        style={{
          left: `${x + 12}px`,
          top: `${y + 12}px`,
          transform: 'none'
        }}
      >
        {children}
      </TooltipContent>
    </TooltipRoot>
  );
}

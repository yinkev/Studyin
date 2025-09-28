'use client';

import { ReactNode } from 'react';
import { TooltipProvider } from '../components/ui/radix/tooltip';

export function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider delayDuration={150}>{children}</TooltipProvider>;
}


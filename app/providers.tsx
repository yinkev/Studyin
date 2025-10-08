'use client';

/**
 * Application Providers
 *
 * Material Web Components themed application
 * - React Query for data fetching
 * - Material Design 3 theme via CSS custom properties
 * - XP/gamification state
 */

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../components/ThemeProvider';
import { XPProvider } from '../components/XPProvider';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1
      }
    }
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <XPProvider>{children}</XPProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

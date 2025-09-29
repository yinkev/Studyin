'use client';

import { ReactNode } from 'react';
import { OKCHeader } from './OKCHeader';
import { OKCFooter } from './OKCFooter';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen okc-light bg-white text-gray-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:outline-none focus:ring-2 focus:ring-green-500">Skip to content</a>
      <OKCHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <OKCFooter />
    </div>
  );
}

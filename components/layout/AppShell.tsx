'use client';

/**
 * AppShell - Unified Layout Wrapper
 * Provides consistent navigation and structure across all pages
 */

import { ReactNode } from 'react';
import { AppNav } from './AppNav';
import { Footer } from './Footer';

interface AppShellProps {
  children: ReactNode;
  currentPage?: string;
  theme?: 'light' | 'dark';
  fullWidth?: boolean; // For pages with full-width hero sections
}

export function AppShell({
  children,
  currentPage = '',
  theme = 'light',
  fullWidth = false
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <AppNav theme={theme} currentPage={currentPage} />

      {/* Main Content */}
      <main className={fullWidth ? 'flex-1' : 'flex-1 max-w-7xl mx-auto w-full'}>
        {children}
      </main>

      <Footer />
    </div>
  );
}

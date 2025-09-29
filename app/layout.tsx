import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import { AppShell } from '../components/layout/AppShell';
import { Nunito } from 'next/font/google';

const nunito = Nunito({ subsets: ['latin'], weight: ['400','600','700','800','900'] });

export const metadata: Metadata = {
  title: 'Studyin — Evidence-anchored mastery engine',
  description: 'Local-first study arcade with deterministic analytics, evidence gates, and temporal RAG.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.className} bg-background text-foreground antialiased`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}

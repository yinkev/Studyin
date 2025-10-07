import '@mantine/core/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './providers';
import { Footer } from '../components/layout/Footer';
import { AppNav } from '../components/layout/AppNav';
import { Nunito } from 'next/font/google';

const nunito = Nunito({ subsets: ['latin'], weight: ['400','600','700','800','900'] });

export const metadata: Metadata = {
  title: 'Studyin — Evidence-anchored mastery engine',
  description: 'Local-first study arcade with deterministic analytics, evidence gates, and temporal RAG.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={`${nunito.className} bg-white text-slate-900 antialiased glass-gradient-mesh`}>
        <Providers>
          <AppNav />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Studyin — Upper Limb Module',
  description: 'Evidence-first OMS-1 study arcade powered by deterministic analytics.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="mx-auto max-w-6xl p-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

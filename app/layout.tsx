import './globals-md3.css';
import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import { Footer } from '../components/layout/Footer';
import { AppNav } from '../components/layout/AppNav';
import { MaterialWebLoader } from '../components/MaterialWebLoader';
import { Nunito, Roboto } from 'next/font/google';

const nunito = Nunito({ subsets: ['latin'], weight: ['400','600','700','800','900'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['400','500','700'], variable: '--md-ref-typeface-plain' });

export const metadata: Metadata = {
  title: 'Studyin — Evidence-anchored mastery engine',
  description: 'Local-first study arcade with deterministic analytics, evidence gates, and temporal RAG.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light" className="light">
      <head>
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className={`${nunito.className} ${roboto.variable} antialiased`}>
        <MaterialWebLoader />
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

import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';

export const metadata: Metadata = {
  title: 'Studyin — Upper Limb Module',
  description: 'Evidence-first OMS-1 study arcade powered by deterministic analytics.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl p-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

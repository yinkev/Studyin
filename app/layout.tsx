import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
} from '@heroui/react';
import Link from 'next/link';
import { Footer } from '../components/layout/Footer';
import { Nunito } from 'next/font/google';

const nunito = Nunito({ subsets: ['latin'], weight: ['400','600','700','800','900'] });

export const metadata: Metadata = {
  title: 'Studyin — Evidence-anchored mastery engine',
  description: 'Local-first study arcade with deterministic analytics, evidence gates, and temporal RAG.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.className} bg-surface-bg1 text-text-high antialiased`}>
        <Providers>
          <Navbar isBordered className="bg-white/95 dark:bg-slate-900/95">
            <NavbarBrand>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-light to-brand-secondary flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <span className="font-extrabold">Studyin</span>
              </Link>
            </NavbarBrand>
            <NavbarContent justify="center" className="hidden sm:flex gap-6">
              <NavbarItem><Link href="/study">Study</Link></NavbarItem>
              <NavbarItem><Link href="/dashboard">Dashboard</Link></NavbarItem>
              <NavbarItem><Link href="/summary">Analytics</Link></NavbarItem>
              <NavbarItem><Link href="/upload">Upload</Link></NavbarItem>
            </NavbarContent>
            <NavbarContent justify="end">
              <NavbarItem>
                <Link href="/docs">
                  <Button size="sm" variant="flat">Docs</Button>
                </Link>
              </NavbarItem>
            </NavbarContent>
          </Navbar>
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

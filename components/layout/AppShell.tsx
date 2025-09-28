'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Button } from '../ui/button';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/study', label: 'Study' },
  { href: '/exam', label: 'Exam' },
  { href: '/drills', label: 'Drills' },
  { href: '/summary', label: 'Summary' },
  { href: '/docs', label: 'Docs' }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/40 lg:flex">
          <div className="flex w-full flex-col gap-6 px-6 py-8">
            <div>
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                Studyin
              </Link>
              <p className="mt-2 text-xs text-slate-400">
                Evidence-first mastery. Deterministic engines. Temporal RAG transparency.
              </p>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              {NAV_ITEMS.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 transition ${
                      active
                        ? 'bg-white text-slate-900 shadow-lg shadow-slate-900/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 group-hover:text-slate-300">
                      {active ? 'Active' : ''}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Next step</p>
              <p className="text-sm text-slate-200">Run the LO extractor on your next module and keep evidence linked.</p>
              <Link href="/study">
                <Button variant="secondary" className="w-full bg-white/90 text-slate-900 hover:bg-white">
                  Continue authoring
                </Button>
              </Link>
            </div>
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-slate-400">Studyin Arcade</span>
                <span className="text-lg font-semibold text-white">Local-first authoring cockpit</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/study">
                  <Button size="sm" variant="outline" className="border-white/30 text-slate-100 hover:bg-white/10">
                    Jump to study
                  </Button>
                </Link>
                <Link href="/summary">
                  <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-200">
                    View analytics
                  </Button>
                </Link>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white/5 to-slate-900/60">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md lg:p-10">
                <div className="space-y-8 text-slate-50">
                  {children}
                </div>
              </div>
            </div>
          </main>
          <footer className="border-t border-white/10 bg-black/30">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-400 lg:px-8">
              <span>© {new Date().getFullYear()} Studyin — Evidence-first · Deterministic · Accessible</span>
              <span>TTI &lt;2s · Item render &lt;100ms · Evidence &lt;250ms</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}


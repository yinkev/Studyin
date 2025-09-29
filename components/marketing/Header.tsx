'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';

const links = [
  { href: '/study', label: 'Study' },
  { href: '/exam', label: 'Exam' },
  { href: '/drills', label: 'Drills' },
  { href: '/summary', label: 'Summary' },
  { href: '/docs', label: 'Docs' }
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-slate-900">
            Studyin
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    active
                      ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white shadow-sm'
                      : 'rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/study">
            <Button size="sm">Start</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

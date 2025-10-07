/**
 * Footer component — shared across Studyin pages.
 * Uses design tokens for surfaces, text, and semantic link treatments.
 */

import Link from 'next/link';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
  { href: 'https://github.com/kyin/Studyin', label: 'GitHub', external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-text-low/10 bg-surface-bg0/80 text-text-med backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-high">Studyin</p>
          <p className="text-xs text-text-low">Adaptive study, deterministic analytics.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {footerLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brand-light"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-brand-light">
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </footer>
  );
}

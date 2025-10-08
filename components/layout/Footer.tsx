'use client';

/**
 * Footer - Material Design 3 Edition
 * Shared footer using official MD3 design tokens
 */

import Link from 'next/link';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
  { href: 'https://github.com/kyin/Studyin', label: 'GitHub', external: true },
];

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--md-sys-color-outline-variant)',
      backgroundColor: 'var(--md-sys-color-surface-container)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2.5rem 1.5rem'
      }} className="md:flex-row md:items-center md:justify-between">
        {/* Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p className="md3-label-large" style={{
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface)'
          }}>
            Studyin
          </p>
          <p className="md3-label-small" style={{
            color: 'var(--md-sys-color-on-surface-variant)'
          }}>
            Adaptive study, deterministic analytics.
          </p>
        </div>

        {/* Links */}
        <nav style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {footerLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="md3-label-large footer-link"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="md3-label-large footer-link"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* CSS for hover effects */}
        <style jsx>{`
          .footer-link {
            color: var(--md-sys-color-on-surface-variant);
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .footer-link:hover {
            color: var(--md-sys-color-primary);
          }
        `}</style>
      </div>
    </footer>
  );
}

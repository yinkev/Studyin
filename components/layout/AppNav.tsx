'use client';

/**
 * AppNav - Material Design 3 Navigation
 * Unified navigation using Material Web Components
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '../ThemeSwitcher';

interface AppNavProps {
  theme?: 'light' | 'dark';
  currentPage?: string;
}

export function AppNav({ theme = 'dark', currentPage = '' }: AppNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/study', label: 'Study' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/summary', label: 'Analytics' },
    { href: '/upload', label: 'Upload' },
  ];

  const handleMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav className="md3-surface-container" style={{
      borderBottom: '1px solid var(--md-sys-color-outline-variant)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(var(--md-sys-color-surface-rgb, 26, 28, 30), 0.95)'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{
          height: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Logo + Mobile Burger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Mobile Menu Button */}
            <md-icon-button
              className="sm:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </md-icon-button>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <div className="md3-elevation-2" style={{
                width: '2.75rem',
                height: '2.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-on-primary)" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span className="md3-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 800
              }}>
                Studyin
              </span>
            </Link>
          </div>

          {/* Center: Nav Links (hidden on mobile) */}
          <div style={{ display: 'none', gap: '0.5rem' }} className="sm:flex">
            {navLinks.map((link) => {
              const isActive = currentPage === link.href;
              return isActive ? (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <md-filled-tonal-button>
                    {link.label}
                  </md-filled-tonal-button>
                </Link>
              ) : (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <md-text-button>
                    {link.label}
                  </md-text-button>
                </Link>
              );
            })}
          </div>

          {/* Right: Theme + User Menu */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ThemeSwitcher />
            <md-icon-button
              onClick={handleMenuToggle}
              aria-label="User menu"
              style={{ position: 'relative' }}
            >
              {/* Notification Badge */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--md-sys-color-error)',
                border: '2px solid var(--md-sys-color-surface)',
                fontSize: '8px',
                color: 'var(--md-sys-color-on-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: 1
              }}>
                3
              </div>
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--md-sys-color-tertiary), var(--md-sys-color-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-on-tertiary)" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </md-icon-button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999
                  }}
                  onClick={() => setIsUserMenuOpen(false)}
                />
                {/* Menu */}
                <md-menu
                  ref={menuRef}
                  open={isUserMenuOpen}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    zIndex: 1000,
                    minWidth: '200px'
                  }}
                >
                  <md-menu-item onClick={() => { setIsUserMenuOpen(false); }}>
                    <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                      Dashboard
                    </Link>
                  </md-menu-item>
                  <md-menu-item onClick={() => { setIsUserMenuOpen(false); }}>
                    <Link href="/study" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                      Study
                    </Link>
                  </md-menu-item>
                  <md-menu-item onClick={() => { setIsUserMenuOpen(false); }}>
                    <Link href="/summary" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                      Analytics
                    </Link>
                  </md-menu-item>
                  <md-menu-item onClick={() => { setIsUserMenuOpen(false); }}>
                    <Link href="/upload" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                      Upload Content
                    </Link>
                  </md-menu-item>
                  <md-divider />
                  <md-menu-item onClick={() => { setIsUserMenuOpen(false); }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                      Home
                    </Link>
                  </md-menu-item>
                </md-menu>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden" style={{
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navLinks.map((link) => {
              const isActive = currentPage === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  {isActive ? (
                    <md-filled-tonal-button style={{ width: '100%', justifyContent: 'flex-start' }}>
                      {link.label}
                    </md-filled-tonal-button>
                  ) : (
                    <md-text-button style={{ width: '100%', justifyContent: 'flex-start' }}>
                      {link.label}
                    </md-text-button>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

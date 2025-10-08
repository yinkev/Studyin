/**
 * World-Class App Header
 * Professional navigation with icons, dark mode toggle, and user info
 */

'use client';

import { MD3Button } from './MD3Button';
import { DarkModeToggle } from './DarkModeToggle';

interface AppHeaderProps {
  darkMode: boolean;
  onDarkModeToggle: (darkMode: boolean) => void;
  currentPage?: 'study' | 'upload' | 'analytics' | 'dashboard';
  userLevel?: number;
  userXP?: number;
  notificationCount?: number;
}

export function AppHeader({
  darkMode,
  onDarkModeToggle,
  currentPage = 'study',
  userLevel = 7,
  userXP = 2450,
  notificationCount = 0,
}: AppHeaderProps) {
  const theme = {
    headerBg: 'color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent)',
    headerBorder: 'var(--md-sys-color-outline-variant)',
    textPrimary: 'var(--md-sys-color-on-surface)',
    textSecondary: 'var(--md-sys-color-on-surface-variant)'
  } as const;

  return (
    <header className="border-b" style={{
      background: theme.headerBg,
      backdropFilter: darkMode ? 'blur(12px)' : 'none',
      borderColor: theme.headerBorder,
    }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center relative"
            style={{
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 4px 0 #1D4ED8, 0 6px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{
            color: theme.textPrimary,
            fontFamily: 'Space Grotesk, system-ui, sans-serif',
          }}>
            Studyin
          </h1>
        </div>

        {/* Navigation with Icons */}
        <nav className="flex items-center gap-2">
          <MD3Button
            variant={currentPage === 'study' ? 'filled' : 'text'}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            }
          >
            Study
          </MD3Button>

          <MD3Button
            variant={currentPage === 'upload' ? 'filled' : 'text'}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            }
          >
            Upload
          </MD3Button>

          <MD3Button
            variant={currentPage === 'analytics' ? 'filled' : 'text'}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            }
          >
            Analytics
          </MD3Button>

          <MD3Button
            variant={currentPage === 'dashboard' ? 'filled' : 'text'}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            }
          >
            Dashboard
          </MD3Button>

          {/* Dark Mode Toggle */}
          <DarkModeToggle
            darkMode={darkMode}
            onToggle={onDarkModeToggle}
            className="ml-3"
          />
        </nav>

        {/* User Section with Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Level {userLevel}</div>
            <div className="text-xs font-medium" style={{ color: theme.textSecondary }}>{userXP.toLocaleString()} XP</div>
          </div>
          <div className="relative">
            <div
              aria-label="User avatar"
              className="w-9 h-9 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: '2px solid color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent)'
              }}
            />
            {notificationCount > 0 && (
              <span
                aria-label={`${notificationCount} notifications`}
                className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[10px] font-bold md3-primary rounded-full"
                style={{ width: 16, height: 16 }}
              >
                {notificationCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

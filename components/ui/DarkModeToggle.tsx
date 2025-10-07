/**
 * S-Tier Dark Mode Toggle
 * Beautiful gradient pill button with smooth transitions
 */

'use client';

interface DarkModeToggleProps {
  darkMode: boolean;
  onToggle: (darkMode: boolean) => void;
  className?: string;
}

export function DarkModeToggle({ darkMode, onToggle, className = '' }: DarkModeToggleProps) {
  return (
    <button
      onClick={() => onToggle(!darkMode)}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${className}`}
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
          : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        backdropFilter: 'blur(12px)',
        border: darkMode
          ? '2px solid rgba(96, 165, 250, 0.3)'
          : '2px solid rgba(251, 191, 36, 0.4)',
        boxShadow: darkMode
          ? '0 4px 12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 12px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      }}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span className="text-sm font-bold" style={{ color: '#E0F2FE' }}>Dark</span>
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <span className="text-sm font-bold" style={{ color: '#92400E' }}>Light</span>
        </>
      )}
    </button>
  );
}

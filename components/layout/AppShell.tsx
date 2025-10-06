'use client';

/**
 * AppShell — MAX GRAPHICS Hybrid UI (Mission Control + Skill Tree)
 *
 * Architecture:
 * - Header: Mission Control with XP bar, level badge, streak
 * - Left: Collapsible Mission/Skill Tree panel
 * - Center: Main content area (clean, spacious)
 * - Right: Telemetry panel (live stats, patterns, insights)
 *
 * MAX GRAPHICS:
 * - Glowing borders and text
 * - Animated XP bars with shimmer
 * - Rotating level badges
 * - Scanline effects
 * - Holographic text
 * - NO accessibility constraints
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { animate as anime } from 'animejs';
import Mascot from '../Mascot';
import ThemeToggle from '../atoms/ThemeToggle';
import { useXP } from '../XPProvider';
import { getLevelTitle } from '../../lib/xp-system';
import XPDevPanel from '../dev/XPDevPanel';

interface AppShellProps {
  children: ReactNode;
  hideContext?: boolean;
  hideNav?: boolean;
}

export function AppShell({ children, hideContext = false, hideNav = false }: AppShellProps) {
  const mascotRef = useRef<HTMLDivElement>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'missions' | 'tree'>('missions');
  const pathname = usePathname();

  // XP System
  const { progress, levelInfo } = useXP();

  // Mascot float animation
  useEffect(() => {
    if (mascotRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      anime(mascotRef.current, {
        translateY: { from: -5, to: 5 },
        alternate: true,
        loop: true,
        ease: 'inOutSine',
        duration: 2000,
      });
    }
  }, []);

  const getCurrentSection = () => {
    if (pathname.startsWith('/study')) return { name: 'Study', icon: '📚', mission: 'Active Learning' };
    if (pathname.startsWith('/upload')) return { name: 'Upload', icon: '☁️', mission: 'Data Ingestion' };
    if (pathname.startsWith('/analytics')) return { name: 'Analytics', icon: '📊', mission: 'Performance Analysis' };
    if (pathname.startsWith('/insights')) return { name: 'Insights', icon: '💡', mission: 'Pattern Recognition' };
    return { name: 'Home', icon: '🏠', mission: 'Mission Control' };
  };

  const section = getCurrentSection();

  // Use real XP data
  const playerLevel = levelInfo.level;
  const currentXP = levelInfo.currentXP;
  const xpToNextLevel = levelInfo.xpToNextLevel;
  const xpPercent = levelInfo.percentComplete;
  const streak = progress.streak;
  const levelTitle = getLevelTitle(playerLevel);

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col">
      {/* MISSION CONTROL HEADER - MAX GRAPHICS */}
      <header className="sticky top-0 z-50 border-b glow-border backdrop-blur-xl bg-primary/95 shadow-2xl">
        {/* XP Bar - Full width with shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-tertiary/10 overflow-hidden">
          <div
            className="xp-bar h-full transition-all duration-500"
            style={{ width: `${xpPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between h-16 px-4 gap-4">
          {/* LEFT: Logo + Level Badge */}
          <div className="flex items-center gap-4">
            {/* Level Badge - Rotating with glow */}
            <div className="level-badge flex items-center justify-center">
              <span className="text-base font-black text-white z-10 tabular-nums">
                {playerLevel}
              </span>
            </div>

            {/* Logo + Breadcrumb */}
            <Link href="/study" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
              <div ref={mascotRef} className="w-10 h-10">
                <Mascot />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black glow-text-cyan tracking-tight">STUDYIN</span>
                <span className="text-[10px] text-tertiary font-medium uppercase tracking-widest">
                  {section.mission}
                </span>
              </div>
            </Link>

            {/* Mission Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-max border glow-border-subtle">
              <span className="text-sm">{section.icon}</span>
              <span className="text-xs font-bold accent-trust">{section.name}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-accent-trust animate-pulse-glow"></div>
            </div>
          </div>

          {/* CENTER: XP Progress */}
          <div className="hidden xl:flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold accent-mastery tabular-nums">{currentXP.toLocaleString()} XP</span>
              <span className="text-[10px] text-tertiary">/</span>
              <span className="text-xs text-secondary tabular-nums">{xpToNextLevel.toLocaleString()}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-tertiary font-bold">
              {levelTitle}
            </div>
          </div>

          {/* RIGHT: Stats + Theme */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-max border glow-border-subtle hover:scale-105 transition-transform cursor-pointer">
              <span className="text-lg animate-pulse-glow">🔥</span>
              <div className="flex flex-col">
                <span className="text-sm font-black accent-mastery tabular-nums leading-none">{streak}</span>
                <span className="text-[9px] uppercase tracking-wider text-tertiary leading-none">DAYS</span>
              </div>
            </div>

            {/* System Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-max border glow-border-subtle">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-analysis animate-pulse-glow"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-analysis animate-pulse-glow delay-100"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-analysis animate-pulse-glow delay-200"></div>
              </div>
              <span className="text-xs font-bold accent-analysis">OPTIMAL</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT: 3 Columns */}
      <div className="flex-1 flex overflow-hidden scanlines">
        {/* LEFT PANEL - Mission/Skill Tree Toggle */}
        {!hideNav && (
          <aside
            className={`
              border-r glow-border bg-secondary/30 backdrop-blur-sm transition-all duration-300
              ${navCollapsed ? 'w-16' : 'w-64'}
            `}
          >
            <div className="flex flex-col h-full">
              {/* Panel Header with View Toggle */}
              <div className="border-b border-default/30 p-3">
                {!navCollapsed && (
                  <div className="flex gap-1 p-1 rounded-lg bg-tertiary/10 mb-3">
                    <button
                      onClick={() => setViewMode('missions')}
                      className={`
                        flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider
                        transition-all duration-200
                        ${viewMode === 'missions'
                          ? 'bg-accent-trust/20 text-accent-trust border border-accent-trust/30 shadow-glow-cyan'
                          : 'text-tertiary hover:text-secondary'
                        }
                      `}
                    >
                      Missions
                    </button>
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`
                        flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider
                        transition-all duration-200
                        ${viewMode === 'tree'
                          ? 'bg-accent-mastery/20 text-accent-mastery border border-accent-mastery/30 shadow-glow-purple'
                          : 'text-tertiary hover:text-secondary'
                        }
                      `}
                    >
                      Tree
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setNavCollapsed(!navCollapsed)}
                  className="w-full p-2 rounded-lg glass-max border glow-border-subtle hover:scale-105 transition-all text-tertiary hover:text-primary"
                  aria-label={navCollapsed ? 'Expand' : 'Collapse'}
                >
                  <span className="text-sm font-bold">{navCollapsed ? '→' : '←'}</span>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {viewMode === 'missions' ? (
                  // MISSIONS VIEW
                  <>
                    {[
                      { href: '/study', icon: '📚', label: 'Study', status: 'active' },
                      { href: '/upload', icon: '☁️', label: 'Upload', status: 'available' },
                      { href: '/analytics', icon: '📊', label: 'Analytics', status: 'available' },
                      { href: '/insights', icon: '💡', label: 'Insights', status: 'locked' },
                    ].map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            mission-card flex items-center gap-3 p-3 rounded-lg
                            border transition-all duration-200 group
                            ${isActive
                              ? 'glow-border bg-accent-trust/10 text-primary shadow-glow-cyan'
                              : 'border-default/30 bg-secondary/20 hover:bg-secondary/40 text-secondary hover:text-primary'
                            }
                            ${item.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          title={navCollapsed ? item.label : undefined}
                        >
                          <span className={`text-xl ${isActive ? 'animate-pulse-glow' : ''}`}>
                            {item.icon}
                          </span>
                          {!navCollapsed && (
                            <div className="flex-1 flex flex-col">
                              <span className="text-xs font-bold">{item.label}</span>
                              <span className={`text-[9px] uppercase tracking-wider ${
                                item.status === 'active' ? 'accent-analysis' :
                                item.status === 'locked' ? 'text-tertiary' :
                                'text-tertiary'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          )}
                          {isActive && !navCollapsed && (
                            <div className="w-2 h-2 rounded-full bg-accent-trust animate-pulse-glow"></div>
                          )}
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  // SKILL TREE VIEW (placeholder)
                  <div className="p-4 text-center">
                    {!navCollapsed && (
                      <div className="space-y-2">
                        <div className="text-2xl">🌳</div>
                        <p className="text-xs text-secondary">Skill Tree View</p>
                        <p className="text-[10px] text-tertiary">Coming soon...</p>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </aside>
        )}

        {/* CENTER CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-primary">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* RIGHT PANEL - TELEMETRY */}
        {!hideContext && (
          <aside
            className={`
              border-l glow-border bg-secondary/30 backdrop-blur-sm transition-all duration-300
              ${contextCollapsed ? 'w-12' : 'w-80'}
            `}
          >
            <div className="flex flex-col h-full">
              {/* Telemetry Header */}
              <div className="border-b border-default/30 p-3 flex items-center justify-between">
                {!contextCollapsed && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-analysis animate-pulse-glow"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-analysis animate-pulse-glow delay-100"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-analysis animate-pulse-glow delay-200"></div>
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest holographic">
                      TELEMETRY
                    </h2>
                  </div>
                )}
                <button
                  onClick={() => setContextCollapsed(!contextCollapsed)}
                  className="p-2 rounded-lg glass-max border glow-border-subtle hover:scale-105 transition-all text-tertiary hover:text-primary"
                  aria-label={contextCollapsed ? 'Expand' : 'Collapse'}
                >
                  <span className="text-sm font-bold">{contextCollapsed ? '←' : '→'}</span>
                </button>
              </div>

              {/* Telemetry Content */}
              {!contextCollapsed && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {/* Live Stats */}
                  <div className="mission-card p-4 rounded-lg border glow-border-subtle bg-secondary/20">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-tertiary mb-3">
                      LIVE STATS
                    </h3>
                    <div className="space-y-3">
                      {/* Accuracy */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary">Accuracy</span>
                          <span className="text-sm font-black accent-analysis tabular-nums">94%</span>
                        </div>
                        <div className="h-2 rounded-full bg-tertiary/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-analysis to-accent-trust w-[94%] rounded-full animate-shimmer"></div>
                        </div>
                      </div>

                      {/* Speed */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary">Avg Speed</span>
                          <span className="text-sm font-black accent-trust tabular-nums">12s</span>
                        </div>
                        <div className="h-2 rounded-full bg-tertiary/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-trust to-accent-mastery w-[78%] rounded-full animate-shimmer"></div>
                        </div>
                      </div>

                      {/* Focus */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary">Focus</span>
                          <span className="text-sm font-black accent-mastery tabular-nums">89%</span>
                        </div>
                        <div className="h-2 rounded-full bg-tertiary/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-mastery to-accent-analysis w-[89%] rounded-full animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="mission-card p-4 rounded-lg border glow-border-subtle bg-secondary/20">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-tertiary mb-3">
                      SESSION
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary">Questions</span>
                        <span className="font-bold text-secondary tabular-nums">247</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary">Time</span>
                        <span className="font-bold text-secondary tabular-nums">1h 23m</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary">XP Earned</span>
                        <span className="font-bold accent-mastery tabular-nums">+470</span>
                      </div>
                    </div>
                  </div>

                  {/* Pattern Insights */}
                  <div className="mission-card p-4 rounded-lg border glow-border-subtle bg-secondary/20">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-tertiary mb-3">
                      PATTERNS
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-accent-analysis text-sm mt-0.5">✓</span>
                        <span className="text-xs text-secondary leading-tight">Strong in pharmacology</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-warning text-sm mt-0.5">⚠</span>
                        <span className="text-xs text-secondary leading-tight">Anatomy needs review</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent-trust text-sm mt-0.5">→</span>
                        <span className="text-xs text-secondary leading-tight">Peak performance: Morning</span>
                      </div>
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="mission-card p-4 rounded-lg border glow-border-subtle bg-secondary/20">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-tertiary mb-3">
                      SYSTEM HEALTH
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-accent-analysis/10 border border-accent-analysis/20">
                        <div className="text-lg font-black accent-analysis tabular-nums">98%</div>
                        <div className="text-[9px] uppercase tracking-wider text-tertiary">Uptime</div>
                      </div>
                      <div className="p-2 rounded-lg bg-accent-trust/10 border border-accent-trust/20">
                        <div className="text-lg font-black accent-trust tabular-nums">23</div>
                        <div className="text-[9px] uppercase tracking-wider text-tertiary">Sessions</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* XP Dev Panel (dev only) */}
      <XPDevPanel />
    </div>
  );
}

export default AppShell;

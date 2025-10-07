/**
 * Dashboard - Enhanced Bento Grid with Nova Design System
 * World-class dashboard with dark mode and beautiful components
 */

'use client';

import { useState } from 'react';
import {
  Card, CardBody, CardHeader, Progress, Chip, Avatar, Button,
  Badge, Tooltip, CircularProgress, Dropdown, DropdownTrigger,
  DropdownMenu, DropdownItem, Skeleton
} from '@heroui/react';
import { useDashboardMetrics } from '../../lib/hooks/useDashboardMetrics';
import { getLevelTitle } from '../../lib/xp-system';

export default function DashboardNovaPage() {
  const [darkMode, setDarkMode] = useState(false);
  const { metrics, isLoading, error } = useDashboardMetrics('local-dev');

  const theme = darkMode ? {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    headerBg: 'rgba(15, 23, 42, 0.8)',
    headerBorder: 'rgba(71, 85, 105, 0.3)',
    cardBg: 'rgba(30, 41, 59, 0.6)',
    cardBorder: 'rgba(71, 85, 105, 0.3)',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
  } : {
    background: '#F8FAFC',
    headerBg: '#FFFFFF',
    headerBorder: '#E2E8F0',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
  };

  return (
    <div className="min-h-screen transition-all duration-500" style={{
      background: theme.background,
    }}>
      {/* Header */}
      <header className="border-b" style={{
        background: theme.headerBg,
        backdropFilter: darkMode ? 'blur(12px)' : 'none',
        borderColor: theme.headerBorder,
        boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center relative group cursor-pointer"
              style={{
                borderRadius: '16px',
                background: darkMode
                  ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                  : 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                boxShadow: darkMode
                  ? '0 4px 0 #1D4ED8, 0 6px 12px rgba(59, 130, 246, 0.4)'
                  : '0 3px 0 #2563EB, 0 6px 20px rgba(59, 130, 246, 0.25)',
                transition: 'transform 0.2s ease',
              }}
              className="hover:scale-105"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-opacity" style={{
              color: theme.textPrimary,
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
            }}>
              Dashboard
            </h1>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
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
            >
              {darkMode ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span className="text-sm font-bold" style={{ color: '#E0F2FE' }}>Dark</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2">
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

            {/* User */}
            <Tooltip
              content={
                <div className="px-1 py-2">
                  <div className="text-xs font-bold mb-1">Level Progress</div>
                  <Progress size="sm" value={metrics.percentToNextLevel} color="primary" className="max-w-md mb-1" />
                  <div className="text-tiny">{metrics.xpToNextLevel - metrics.currentXP} XP to Level {metrics.level + 1}</div>
                </div>
              }
              placement="bottom"
            >
              <div className="text-right cursor-pointer">
                {isLoading ? (
                  <Skeleton className="h-4 w-20 rounded mb-1" />
                ) : (
                  <>
                    <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Level {metrics.level}</div>
                    <div className="text-xs font-medium" style={{ color: theme.textSecondary }}>{metrics.totalXP.toLocaleString()} XP</div>
                  </>
                )}
              </div>
            </Tooltip>

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <div className="cursor-pointer hover:scale-105 transition-transform">
                  <Badge content="3" color="danger" size="sm" placement="top-right">
                    <Avatar
                      className="w-11 h-11 ring-2 ring-offset-2 transition-all hover:ring-4"
                      style={{
                        background: darkMode
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                          : 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                      }}
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      }
                    />
                  </Badge>
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem key="profile">My Profile</DropdownItem>
                <DropdownItem key="study">Study</DropdownItem>
                <DropdownItem key="analytics">Analytics</DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem key="logout" className="text-danger" color="danger">Log Out</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Main Content - Bento Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-4">

          {/* Large Card - Today's Progress */}
          <Card className="col-span-12 md:col-span-8 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '16px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardHeader className="flex gap-3 items-center p-6 pb-2">
              <div className="p-3 rounded-2xl" style={{
                background: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>Today's Progress</p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Keep up the momentum!</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-6 px-6 pb-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: theme.textSecondary }}>Questions Answered</span>
                      <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>{metrics.questionsAnswered}</span>
                    </div>
                    <Progress
                      value={100}
                      color="success"
                      className="h-3"
                      style={{ background: darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)' }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: theme.textSecondary }}>Study Time</span>
                      <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>{metrics.totalStudyTime.toFixed(1)}h</span>
                    </div>
                    <Progress
                      value={100}
                      color="primary"
                      className="h-3"
                      style={{ background: darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)' }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: theme.textSecondary }}>Accuracy</span>
                      <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>{Math.round(metrics.accuracy)}%</span>
                    </div>
                    <Progress
                      value={metrics.accuracy}
                      color="warning"
                      className="h-3"
                      style={{ background: darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)' }}
                    />
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          {/* Streak Card */}
          <Card className="col-span-6 md:col-span-4 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '32px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardBody className="p-6 flex flex-col items-center justify-center text-center">
              {isLoading ? (
                <>
                  <Skeleton className="w-16 h-16 rounded-full mb-4" />
                  <Skeleton className="h-10 w-16 rounded mb-2" />
                  <Skeleton className="h-4 w-24 rounded" />
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full mb-4" style={{
                    background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <p className="text-4xl font-extrabold mb-2" style={{ color: theme.textPrimary }}>{metrics.streak}</p>
                  <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>Day Streak 🔥</p>
                </>
              )}
            </CardBody>
          </Card>

          {/* Quick Stats - 3 Small Cards */}
          <Card className="col-span-6 md:col-span-4 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '24px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardBody className="p-5">
              {isLoading ? (
                <Skeleton className="h-16 w-full rounded-lg" />
              ) : (
                <div className="flex items-center gap-3">
                  <CircularProgress
                    value={metrics.accuracy}
                    color="success"
                    showValueLabel
                    size="lg"
                  />
                  <div>
                    <p className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{Math.round(metrics.accuracy)}%</p>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>Overall Accuracy</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="col-span-6 md:col-span-4 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '24px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardBody className="p-5">
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-24 rounded mb-1" />
                  <Skeleton className="h-3 w-32 rounded" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1" style={{ color: theme.textPrimary }}>{metrics.questionsCorrect.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: theme.textSecondary }}>Questions Correct</p>
                </>
              )}
            </CardBody>
          </Card>

          <Card className="col-span-6 md:col-span-4 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '24px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardBody className="p-5">
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-20 rounded mb-1" />
                  <Skeleton className="h-3 w-28 rounded" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1" style={{ color: theme.textPrimary }}>{metrics.totalStudyTime.toFixed(1)}h</p>
                  <p className="text-xs" style={{ color: theme.textSecondary }}>Total Study Time</p>
                </>
              )}
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-12 md:col-span-6 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '28px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardHeader className="p-5 pb-2">
              <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>Recent Activity</p>
            </CardHeader>
            <CardBody className="px-5 pb-5 space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </>
              ) : metrics.recentTopics.length > 0 ? (
                metrics.recentTopics.map((item, index) => {
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={item.loId} className="flex items-center justify-between p-3 rounded-xl" style={{
                      background: darkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.8)',
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{item.name}</p>
                          <p className="text-xs" style={{ color: theme.textSecondary }}>{item.questionsAnswered} questions</p>
                        </div>
                      </div>
                      <Chip size="sm" variant="flat" style={{
                        background: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                      }}>
                        {Math.round(item.accuracy)}%
                      </Chip>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8" style={{ color: theme.textSecondary }}>
                  <p className="text-sm">No activity yet. Start studying to see your progress!</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-12 md:col-span-6 transition-all duration-500" style={{
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            borderRadius: '28px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <CardHeader className="p-5 pb-2">
              <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>Quick Actions</p>
            </CardHeader>
            <CardBody className="px-5 pb-5 space-y-3">
              <Button fullWidth size="lg" color="primary" startContent={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              }>
                Continue Studying
              </Button>
              <Button fullWidth size="lg" variant="flat" startContent={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              }>
                View Analytics
              </Button>
              <Button fullWidth size="lg" variant="bordered" startContent={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }>
                Settings
              </Button>
            </CardBody>
          </Card>

        </div>
      </main>
    </div>
  );
}

/**
 * World-Class Gamified Learning Dashboard
 * Built with HeroUI and Bento Grid, featuring comprehensive gamification and learning analytics
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@mantine/core';
import { useDashboardMetrics } from '../../lib/hooks/useDashboardMetrics';
import { BentoGrid } from '@/components/layout/BentoGrid';
import { ProgressCard } from '@/components/cards/ProgressCard';
import { StatsCard } from '@/components/cards/StatsCard';
import { ActionCard } from '@/components/cards/ActionCard';
import { DailyQuestsCard } from '@/components/dashboard/DailyQuestsCard';
import { AchievementsCard } from '@/components/dashboard/AchievementsCard';
import { LessonBrowserCard } from '@/components/dashboard/LessonBrowserCard';

export default function DashboardPage() {
  const router = useRouter();
  const { metrics, isLoading, error } = useDashboardMetrics('local-dev');

  // Check if this is a brand new user with no data
  const isNewUser = !isLoading && metrics.questionsAnswered === 0;

  if (error) {
    return (
      <main className="min-h-screen px-6 py-8 flex items-center justify-center">
        <div className="glass-clinical-card max-w-md">
          <div className="text-center">
            <p className="text-semantic-danger font-semibold mb-2">Error Loading Dashboard</p>
            <p className="text-text-med text-sm">{error.message}</p>
          </div>
        </div>
      </main>
    );
  }

  // Show beautiful onboarding for new users
  if (isNewUser) {
    return (
      <main className="min-h-screen px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="glass-clinical-card">
            <div className="p-8 md:p-12 text-center">
              {/* Hero Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-2xl shadow-clinical-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
              </div>

              {/* Welcome Message */}
              <h1 className="text-3xl md:text-4xl font-extrabold text-text-high mb-3">
                Welcome to Your Learning Dashboard!
              </h1>
              <p className="text-lg text-text-med mb-8 max-w-xl mx-auto">
                Start your journey to mastery. Your progress, achievements, and learning insights will appear here as you study.
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl glass-subtle">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm font-bold text-text-high mb-1">Track Progress</p>
                  <p className="text-xs text-text-med">XP, levels, and streaks</p>
                </div>
                <div className="p-4 rounded-xl glass-subtle">
                  <div className="text-3xl mb-2">🏆</div>
                  <p className="text-sm font-bold text-text-high mb-1">Earn Achievements</p>
                  <p className="text-xs text-text-med">Unlock rewards as you learn</p>
                </div>
                <div className="p-4 rounded-xl glass-subtle">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm font-bold text-text-high mb-1">View Analytics</p>
                  <p className="text-xs text-text-med">Track accuracy and trends</p>
                </div>
              </div>

              {/* CTA */}
              <Link href="/study">
                <Button
                  size="lg"
                  className="clinical-button text-lg px-8 shadow-clinical-lg hover:shadow-clinical-xl transition-all"
                  leftSection={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  }
                >
                  Start Your First Session
                </Button>
              </Link>

              <p className="text-xs text-text-low mt-4">
                Your progress will be saved automatically
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-text-high mb-1">
                Welcome Back!
              </h1>
              <p className="text-text-med text-sm md:text-base">
                {metrics.recommendedFocus}
              </p>
            </div>

            {/* Mini-Game Button */}
            <Link href="/games/follow-the-money">
              <Button
                size="lg"
                className="clinical-button font-bold shadow-clinical-md"
                leftSection={<span>💰</span>}
              >
                Play Mini-Game
              </Button>
            </Link>
          </div>
        </div>

        {/* Bento Grid Dashboard */}
        <BentoGrid layout="dashboard" stagger={true} gap="md">

          {/* Progress Card - Large (8 cols, 4 rows) */}
          <ProgressCard
            level={metrics.level}
            totalXP={metrics.totalXP}
            currentXP={metrics.currentXP}
            xpToNextLevel={metrics.xpToNextLevel}
            percentToNextLevel={metrics.percentToNextLevel}
            streak={metrics.streak}
            size="lg"
          />

          {/* Stats Cards - 3x Small (4 cols, 2 rows each) */}
          <StatsCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
            value={`${Math.round(metrics.accuracy)}%`}
            label="Overall Accuracy"
            accent="success"
            size="sm"
          />

          <StatsCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
            value={`${metrics.totalStudyTime.toFixed(1)}h`}
            label="Total Study Time"
            accent="primary"
            size="sm"
          />

          <StatsCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            }
            value={metrics.questionsCorrect.toLocaleString()}
            label="Questions Correct"
            accent="success"
            size="sm"
          />

          {/* Action Card - Medium (4 cols, 4 rows) */}
          <ActionCard
            title="Ready to Learn?"
            description="Continue your progress"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            }
            buttonText="Start Studying"
            buttonIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            }
            onAction={() => router.push('/study')}
            gradient={true}
            size="md"
          />

          {/* Daily Quests Card - Large (8 cols, 4 rows) */}
          <DailyQuestsCard
            quests={metrics.quests.daily}
            isLoading={isLoading}
            size="lg"
          />

          {/* Achievements Card - Full Width (12 cols, auto) */}
          <AchievementsCard
            achievements={metrics.achievements}
            isLoading={isLoading}
            size="full"
          />

          {/* Lesson Browser Card - Full Width (12 cols, auto) */}
          <LessonBrowserCard size="full" />

        </BentoGrid>
      </div>
    </main>
  );
}

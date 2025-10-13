import { useEffect } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { LearningOverview } from '@/components/analytics/LearningOverview';
import { StudyHeatmap } from '@/components/analytics/StudyHeatmap';
import { XPTrendChart } from '@/components/analytics/XPTrendChart';
import { Button } from '@/components/ui/button';
import { trackNavigation } from '@/lib/analytics/tracker';
import type { View } from '@/components/NavBar';

// ============================================================================
// Types
// ============================================================================

interface AnalyticsViewProps {
  onNavigate: (view: View) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AnalyticsView({ onNavigate }: AnalyticsViewProps) {
  const {
    learningOverview,
    activityHeatmap,
    gamificationProgress,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useAnalytics({
    autoFetch: true,
    pollingInterval: 0, // Disable polling, use manual refresh
  });

  // Track page view
  useEffect(() => {
    trackNavigation('unknown', 'analytics');
  }, []);

  const handleRefresh = () => {
    refresh();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="soft-card pixel-border px-12 py-10 text-center">
          <div className="animate-spin mb-4 inline-block">
            <span className="kawaii-icon text-4xl" aria-hidden="true">
              🔄
            </span>
          </div>
          <p className="text-brutalist text-lg text-foreground">Loading your analytics...</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Crunching numbers and preparing insights
          </p>
        </div>
      </div>
    );
  }

  if (error && !learningOverview) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen px-6">
        <div className="soft-card pixel-border max-w-md px-8 py-10 text-center">
          <span className="kawaii-icon text-5xl mb-4" aria-hidden="true">
            😢
          </span>
          <p className="text-brutalist text-xl text-foreground mb-3">Oops! Something went wrong</p>
          <p className="text-sm text-muted-foreground mb-6">
            {error}
          </p>
          <Button onClick={handleRefresh} size="lg" className="shadow-soft-button">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Extract achievement data from recent achievements
  const achievements = gamificationProgress?.recent_achievements ?? [];
  const unlockedCount = achievements.length; // Recent achievements are already unlocked
  const totalCount = gamificationProgress?.total_achievements ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10">
      {/* Header */}
      <header className="soft-card pixel-border glass px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 flex items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
              <span className="text-primary text-xl">▦</span>
            </div>
            <div>
              <h1 className="text-brutalist text-foreground">Your Learning Analytics</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Track your progress, identify patterns, and optimize your study strategy with data-driven insights.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      {/* Learning Overview Metrics */}
      {learningOverview && (
        <LearningOverview
          data={learningOverview}
        />
      )}

      {/* XP Trend Chart */}
      {gamificationProgress && gamificationProgress.xp_history.length > 0 && (
        <XPTrendChart data={gamificationProgress} />
      )}

      {/* Study Activity Heatmap */}
      {activityHeatmap && activityHeatmap.length > 0 && (
        <StudyHeatmap data={activityHeatmap} />
      )}

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <section className="soft-card pixel-border px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="kawaii-icon text-3xl" aria-hidden="true">
                🏆
              </span>
              <div>
                <h2 className="text-brutalist text-xl text-foreground">Achievement Gallery</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {unlockedCount} of {totalCount} achievements unlocked
                </p>
              </div>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted/70">
              <div className="h-full bg-primary transition-all duration-500 ease-soft-bounce" style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }} aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => {
              return (
                <div
                  key={achievement.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-soft hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 px-5 py-6"
                >
                  <div className="absolute -right-3 -top-3 h-16 w-16 rotate-12 rounded-xl bg-primary/15 blur-2xl" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <span className="kawaii-icon text-3xl" aria-hidden="true">
                        🏅
                      </span>
                      <span className="rounded-full bg-primary/20 px-3 py-1 font-pixel text-[0.5rem] tracking-[0.18em] text-primary">
                        UNLOCKED
                      </span>
                    </div>

                    <h3 className="text-brutalist text-base text-foreground mb-2">
                      Achievement #{achievement.id}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Unlocked {new Date(achievement.earned_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="soft-card pixel-border px-8 py-8">
        <div className="flex items-start gap-4">
          <span className="kawaii-icon text-3xl" aria-hidden="true">
            🚀
          </span>
          <div className="flex-1">
            <h3 className="text-brutalist text-lg text-foreground mb-3">Keep Building Momentum</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Analytics show patterns, but action creates progress. Choose your next step:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => onNavigate('dashboard')}
                className="shadow-soft-button"
              >
                <TrendingUp className="size-4" aria-hidden="true" />
                Back to Dashboard
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => onNavigate('chat')}
                className="shadow-soft-button"
              >
                💬 Start AI Session
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => onNavigate('upload')}
              >
                📚 Upload Material
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Empty State for New Users */}
      {!isLoading &&
        learningOverview?.total_sessions === 0 &&
        activityHeatmap?.length === 0 &&
        gamificationProgress?.xp_history.length === 0 && (
          <div className="soft-card pixel-border px-12 py-16 text-center">
            <span className="kawaii-icon text-6xl mb-6" aria-hidden="true">
              📊
            </span>
            <h2 className="text-brutalist text-2xl text-foreground mb-4">
              Your Analytics Journey Starts Here
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
              Begin studying to unlock powerful insights about your learning patterns, progress trends, and
              achievement milestones. Every session adds to your story.
            </p>
            <Button
              size="lg"
              onClick={() => onNavigate('dashboard')}
              className="shadow-soft-button"
            >
              <TrendingUp className="size-4" aria-hidden="true" />
              Start Your First Session
            </Button>
          </div>
        )}
    </div>
  );
}

export default AnalyticsView;

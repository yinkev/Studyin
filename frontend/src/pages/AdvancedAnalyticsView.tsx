import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { QuestionMasteryRadar } from '@/components/analytics/QuestionMasteryRadar';
import { PerformanceWindowHeatmap } from '@/components/analytics/PerformanceWindowHeatmap';
import { getQuestionMastery, getPerformanceWindows } from '@/lib/api/analytics';
import type { QuestionMasteryResponse, PerformanceWindowResponse } from '@/lib/api/analytics';
import { trackNavigation } from '@/lib/analytics/tracker';
import { toast } from 'sonner';
import type { View } from '@/components/NavBar';

// ============================================================================
// Types
// ============================================================================

interface AdvancedAnalyticsViewProps {
  onNavigate: (view: View) => void;
}

type AnalyticsTab = 'mastery' | 'performance';

// ============================================================================
// Component
// ============================================================================

export function AdvancedAnalyticsView({ onNavigate }: AdvancedAnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('mastery');

  // Mastery data state
  const [masteryData, setMasteryData] = useState<QuestionMasteryResponse | null>(null);
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [masteryError, setMasteryError] = useState<string | null>(null);

  // Performance data state
  const [performanceData, setPerformanceData] = useState<PerformanceWindowResponse | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track page view
  useEffect(() => {
    trackNavigation('unknown', 'advanced-analytics');
  }, []);

  // Fetch mastery data
  const fetchMasteryData = async (silent = false) => {
    if (!silent) setMasteryLoading(true);
    setMasteryError(null);

    try {
      const data = await getQuestionMastery();
      setMasteryData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load mastery data';
      setMasteryError(message);
      if (!silent) {
        toast.error(message);
      }
      console.error('[AdvancedAnalytics] Mastery fetch error:', err);
    } finally {
      setMasteryLoading(false);
    }
  };

  // Fetch performance data
  const fetchPerformanceData = async (silent = false) => {
    if (!silent) setPerformanceLoading(true);
    setPerformanceError(null);

    try {
      const data = await getPerformanceWindows();
      setPerformanceData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load performance data';
      setPerformanceError(message);
      if (!silent) {
        toast.error(message);
      }
      console.error('[AdvancedAnalytics] Performance fetch error:', err);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMasteryData(false);
    fetchPerformanceData(false);
  }, []);

  // Refresh both datasets
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMasteryData(true),
      fetchPerformanceData(true),
    ]);
    setIsRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const isLoading = masteryLoading || performanceLoading;
  const hasError = masteryError || performanceError;

  // Full page loading state
  if (isLoading && !masteryData && !performanceData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="soft-card pixel-border px-12 py-10 text-center"
        >
          <div className="animate-spin mb-4 inline-block">
            <span className="kawaii-icon text-4xl" aria-hidden="true">
              🔄
            </span>
          </div>
          <p className="text-brutalist text-lg text-foreground">Loading advanced analytics...</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Analyzing your performance patterns
          </p>
        </motion.div>
      </div>
    );
  }

  // Full page error state (only if no data at all)
  if (hasError && !masteryData && !performanceData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="soft-card pixel-border max-w-md px-8 py-10 text-center"
        >
          <span className="kawaii-icon text-5xl mb-4" aria-hidden="true">
            😢
          </span>
          <p className="text-brutalist text-xl text-foreground mb-3">Oops! Something went wrong</p>
          <p className="text-sm text-muted-foreground mb-6">
            {masteryError || performanceError}
          </p>
          <Button onClick={handleRefresh} size="lg" className="shadow-soft-button">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="soft-card pixel-border bg-gradient-to-br from-white/90 via-white/70 to-primary/10 px-8 py-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="kawaii-icon size-16 text-4xl" aria-hidden="true">
              📊
            </span>
            <div>
              <h1 className="text-brutalist text-foreground">Advanced Analytics</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Deep insights into your mastery patterns and peak performance windows
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
      </motion.header>

      {/* Analytics Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalyticsTab)}>
          <TabsList className="soft-card pixel-border w-full sm:w-auto">
            <TabsTrigger value="mastery" className="gap-2">
              <BarChart3 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Question Mastery</span>
              <span className="sm:hidden">Mastery</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <TrendingUp className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Performance Windows</span>
              <span className="sm:hidden">Performance</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Mastery Tab */}
            <TabsContent value="mastery" className="mt-6">
              <motion.div
                key="mastery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {masteryLoading && !masteryData ? (
                  <div className="soft-card pixel-border flex min-h-[500px] items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin mb-4 inline-block">
                        <span className="kawaii-icon text-3xl" aria-hidden="true">
                          🔄
                        </span>
                      </div>
                      <p className="text-brutalist text-sm text-muted-foreground">Loading mastery data...</p>
                    </div>
                  </div>
                ) : masteryError && !masteryData ? (
                  <div className="soft-card pixel-border flex min-h-[500px] items-center justify-center">
                    <div className="text-center">
                      <span className="kawaii-icon text-4xl mb-4" aria-hidden="true">
                        😢
                      </span>
                      <p className="text-brutalist text-base text-muted-foreground mb-3">
                        Failed to load mastery data
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">{masteryError}</p>
                      <Button onClick={() => fetchMasteryData(false)} size="sm">
                        <RefreshCw className="size-4" aria-hidden="true" />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : masteryData ? (
                  <QuestionMasteryRadar data={masteryData} />
                ) : null}
              </motion.div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-6">
              <motion.div
                key="performance"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {performanceLoading && !performanceData ? (
                  <div className="soft-card pixel-border flex min-h-[500px] items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin mb-4 inline-block">
                        <span className="kawaii-icon text-3xl" aria-hidden="true">
                          🔄
                        </span>
                      </div>
                      <p className="text-brutalist text-sm text-muted-foreground">Loading performance data...</p>
                    </div>
                  </div>
                ) : performanceError && !performanceData ? (
                  <div className="soft-card pixel-border flex min-h-[500px] items-center justify-center">
                    <div className="text-center">
                      <span className="kawaii-icon text-4xl mb-4" aria-hidden="true">
                        😢
                      </span>
                      <p className="text-brutalist text-base text-muted-foreground mb-3">
                        Failed to load performance data
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">{performanceError}</p>
                      <Button onClick={() => fetchPerformanceData(false)} size="sm">
                        <RefreshCw className="size-4" aria-hidden="true" />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : performanceData ? (
                  <PerformanceWindowHeatmap data={performanceData} />
                ) : null}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="soft-card pixel-border px-8 py-8"
      >
        <div className="flex items-start gap-4">
          <span className="kawaii-icon text-3xl" aria-hidden="true">
            🚀
          </span>
          <div className="flex-1">
            <h3 className="text-brutalist text-lg text-foreground mb-3">Take Action on Insights</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Use these analytics to optimize your study strategy and maximize learning outcomes.
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
                onClick={() => onNavigate('analytics')}
                className="shadow-soft-button"
              >
                📊 View Basic Analytics
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => onNavigate('chat')}
              >
                💬 Discuss with AI Coach
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Empty State for New Users */}
      {!isLoading &&
        (!masteryData || masteryData.topic_mastery.length === 0) &&
        (!performanceData || performanceData.performance_windows.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="soft-card pixel-border px-12 py-16 text-center"
          >
            <span className="kawaii-icon text-6xl mb-6" aria-hidden="true">
              📈
            </span>
            <h2 className="text-brutalist text-2xl text-foreground mb-4">
              Build Your Analytics Profile
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
              Answer questions across different topics and study throughout the week to unlock
              powerful insights about your mastery patterns and peak performance windows.
            </p>
            <Button
              size="lg"
              onClick={() => onNavigate('dashboard')}
              className="shadow-soft-button"
            >
              <TrendingUp className="size-4" aria-hidden="true" />
              Start Learning
            </Button>
          </motion.div>
        )}
    </div>
  );
}

export default AdvancedAnalyticsView;

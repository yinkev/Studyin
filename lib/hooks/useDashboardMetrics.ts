'use client';

/**
 * useDashboardMetrics - React Hook for Dashboard Data
 *
 * Fetches and computes dashboard metrics from learner state
 * Handles loading states and errors
 */

import { useState, useEffect } from 'react';
import { fetchDashboardMetrics, DashboardMetrics, DEFAULT_DASHBOARD_METRICS } from '../services/dashboardAnalytics';

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardMetrics(learnerId: string = 'local-dev'): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_DASHBOARD_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[useDashboardMetrics] Fetching for learnerId:', learnerId);
        const data = await fetchDashboardMetrics(learnerId);
        console.log('[useDashboardMetrics] Got data:', data);
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard metrics'));
        console.error('[useDashboardMetrics] Error:', err);
      } finally {
        console.log('[useDashboardMetrics] Setting isLoading to false');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [learnerId]);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDashboardMetrics(learnerId);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard metrics'));
      console.error('Dashboard metrics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    metrics,
    isLoading,
    error,
    refetch,
  };
}

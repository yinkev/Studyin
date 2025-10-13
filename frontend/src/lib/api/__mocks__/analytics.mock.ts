/**
 * Mock data for Phase 1 analytics testing
 * Use these for development when backend is not available
 */

import type { QuestionMasteryResponse, PerformanceWindowResponse } from '../analytics';

// ============================================================================
// Question Mastery Mock Data
// ============================================================================

export const mockQuestionMasteryData: QuestionMasteryResponse = {
  user_id: 'test-user-123',
  topic_mastery: [
    {
      topic_name: 'Cardiology',
      mastery_score: 85.5,
      questions_answered: 42,
      correct_rate: 0.83,
    },
    {
      topic_name: 'Neurology',
      mastery_score: 78.2,
      questions_answered: 35,
      correct_rate: 0.76,
    },
    {
      topic_name: 'Pharmacology',
      mastery_score: 92.1,
      questions_answered: 50,
      correct_rate: 0.91,
    },
    {
      topic_name: 'Pathology',
      mastery_score: 68.4,
      questions_answered: 28,
      correct_rate: 0.64,
    },
    {
      topic_name: 'Biochemistry',
      mastery_score: 75.8,
      questions_answered: 38,
      correct_rate: 0.74,
    },
    {
      topic_name: 'Immunology',
      mastery_score: 81.3,
      questions_answered: 45,
      correct_rate: 0.80,
    },
    {
      topic_name: 'Microbiology',
      mastery_score: 73.9,
      questions_answered: 32,
      correct_rate: 0.72,
    },
    {
      topic_name: 'Anatomy',
      mastery_score: 88.7,
      questions_answered: 48,
      correct_rate: 0.87,
    },
  ],
  benchmark_mastery: 0.75,
  overall_mastery: 0.803,
};

// ============================================================================
// Performance Windows Mock Data
// ============================================================================

/**
 * Generate realistic performance window data for 7 days × 24 hours
 */
function generatePerformanceWindows() {
  const windows = [];

  // Performance patterns:
  // - Morning (7-11): High performance
  // - Afternoon (12-17): Medium performance
  // - Evening (18-22): Medium-high performance
  // - Night (23-6): Low performance
  // - Weekend: Slightly lower performance

  for (let day = 0; day < 7; day++) {
    const isWeekend = day >= 5; // Saturday (5) and Sunday (6)

    for (let hour = 0; hour < 24; hour++) {
      let basePerformance = 50;

      // Time of day effect
      if (hour >= 7 && hour <= 11) {
        basePerformance = 85; // Morning peak
      } else if (hour >= 12 && hour <= 17) {
        basePerformance = 70; // Afternoon
      } else if (hour >= 18 && hour <= 22) {
        basePerformance = 75; // Evening
      } else {
        basePerformance = 40; // Night/early morning
      }

      // Weekend penalty
      if (isWeekend) {
        basePerformance -= 10;
      }

      // Add some randomness
      const variance = Math.random() * 15 - 7.5; // -7.5 to +7.5
      const performanceScore = Math.max(0, Math.min(100, basePerformance + variance));

      // Questions answered varies by performance
      const questionsAnswered = Math.floor(
        (performanceScore / 100) * 20 + Math.random() * 10
      );

      // Response time inversely related to performance
      const avgResponseTime = 30 + (100 - performanceScore) * 0.5 + Math.random() * 10;

      windows.push({
        day_of_week: day,
        hour: hour,
        performance_score: parseFloat(performanceScore.toFixed(1)),
        questions_answered: questionsAnswered,
        avg_response_time_seconds: parseFloat(avgResponseTime.toFixed(1)),
      });
    }
  }

  return windows;
}

export const mockPerformanceWindowData: PerformanceWindowResponse = {
  user_id: 'test-user-123',
  performance_windows: generatePerformanceWindows(),
  recommendations: {
    peak_windows: [
      {
        day: 'Monday',
        hour_range: '9-11 AM',
        performance_score: 88.5,
      },
      {
        day: 'Tuesday',
        hour_range: '8-10 AM',
        performance_score: 87.2,
      },
      {
        day: 'Wednesday',
        hour_range: '7-9 PM',
        performance_score: 85.8,
      },
      {
        day: 'Thursday',
        hour_range: '9-11 AM',
        performance_score: 86.3,
      },
    ],
    suggested_study_times: [
      'Weekday mornings (7-11 AM)',
      'Tuesday and Thursday evenings (7-9 PM)',
      'Avoid late nights after 11 PM',
    ],
    insights: [
      'You perform 22% better in morning sessions compared to evenings',
      'Weekend performance is 12% lower - consider scheduling lighter review sessions',
      'Your focus peaks between 9-10 AM on weekdays',
      'Response time increases significantly after 10 PM - avoid new material then',
      'Thursday morning shows consistently high performance - ideal for challenging topics',
    ],
  },
};

// ============================================================================
// Empty State Mock Data (for testing)
// ============================================================================

export const mockEmptyMasteryData: QuestionMasteryResponse = {
  user_id: 'new-user-456',
  topic_mastery: [],
  benchmark_mastery: 0.75,
  overall_mastery: 0,
};

export const mockEmptyPerformanceData: PerformanceWindowResponse = {
  user_id: 'new-user-456',
  performance_windows: [],
  recommendations: {
    peak_windows: [],
    suggested_study_times: [],
    insights: [],
  },
};

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Simulate API delay for realistic testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock API functions that return mock data with simulated delay
 */
export async function getMockQuestionMastery(): Promise<QuestionMasteryResponse> {
  await delay(800); // Simulate network delay
  return mockQuestionMasteryData;
}

export async function getMockPerformanceWindows(): Promise<PerformanceWindowResponse> {
  await delay(1000); // Simulate network delay
  return mockPerformanceWindowData;
}

/**
 * Mock API function that simulates an error
 */
export async function getMockError(): Promise<never> {
  await delay(500);
  throw new Error('Failed to fetch analytics data. Please try again later.');
}

// ============================================================================
// Usage in Components (Development Mode)
// ============================================================================

/**
 * Example usage in AdvancedAnalyticsView.tsx:
 *
 * import { getMockQuestionMastery, getMockPerformanceWindows } from '@/lib/api/__mocks__/analytics.mock';
 *
 * // In development, use mock data:
 * const fetchMasteryData = async () => {
 *   if (import.meta.env.DEV && !BACKEND_AVAILABLE) {
 *     const data = await getMockQuestionMastery();
 *     setMasteryData(data);
 *   } else {
 *     const data = await getQuestionMastery();
 *     setMasteryData(data);
 *   }
 * };
 */

/**
 * FSRS (Free Spaced Repetition Scheduler) API Client
 *
 * Provides TypeScript client for interacting with the FSRS backend API.
 * Handles review scheduling, card management, and parameter optimization.
 *
 * Features:
 * - Type-safe API calls with full backend schema compatibility
 * - Automatic token refresh via apiClient
 * - Integration with ts-fsrs for client-side preview calculations
 */

import { apiClient } from '@/lib/api/client';

// ============================================================================
// TYPES - Matching backend Pydantic schemas
// ============================================================================

export type FSRSCardState = 'new' | 'learning' | 'review' | 'relearning';

export type FSRSRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface FSRSCard {
  id: string;
  user_id: string;
  chunk_id?: string;
  topic_id?: string;
  flashcard_content?: string;

  // FSRS memory model
  difficulty: number;
  stability: number;
  retrievability: number;

  // Scheduling
  state: FSRSCardState;
  due_date: string; // ISO datetime
  last_review?: string; // ISO datetime
  elapsed_days: number;
  scheduled_days: number;

  // Statistics
  reps: number;
  lapses: number;
  ease_factor: number;
  average_response_time_seconds?: number;
  consecutive_correct: number;

  // Metadata
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface FSRSReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  rating: FSRSRating;
  review_duration_seconds?: number;
  reviewed_at: string; // ISO datetime

  // State snapshots
  state_before: FSRSCardState;
  difficulty_before: number;
  stability_before: number;
  state_after: FSRSCardState;
  difficulty_after: number;
  stability_after: number;

  // Scheduling
  scheduled_days: number;
  elapsed_days: number;

  review_context?: Record<string, unknown>;
}

export interface FSRSParameters {
  id: string;
  user_id?: string;
  topic_id?: string;
  parameters: {
    w: number[]; // 19-21 weight parameters
    request_retention: number;
    maximum_interval: number;
    enable_fuzz: boolean;
  };
  version: string;
  optimized: number;
  sample_size: number;
  loss?: number;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetDueCardsRequest {
  limit?: number;
  topic_id?: string;
  include_new?: boolean;
}

export interface DueCardsResponse {
  cards: FSRSCard[];
  total_count: number;
  has_more: boolean;
}

export interface SubmitReviewRequest {
  rating: FSRSRating;
  review_duration_seconds?: number;
}

export interface ReviewSuccessResponse {
  card: FSRSCard;
  next_review_date: string; // ISO datetime
  interval_days: number;
  retention_probability: number;
  xp_earned: number;
  streak_maintained: boolean;
}

export interface UpcomingReviewsResponse {
  schedule: Record<string, number>; // date (ISO) -> count
  total_reviews: number;
  days_ahead: number;
}

export interface RetentionPredictionResponse {
  card_id: string;
  retention_probability: number;
  days_since_review?: number;
  stability_days: number;
  optimal_review_date: string; // ISO datetime
}

export interface CreateCardRequest {
  chunk_id?: string;
  topic_id?: string;
  flashcard_content?: string;
  initial_due_date?: string; // ISO datetime
}

export interface BulkCreateCardsRequest {
  chunk_ids: string[];
  topic_ids: string[];
  initial_due_date?: string; // ISO datetime
}

export interface BulkCreateCardsResponse {
  created_count: number;
  skipped_count: number;
  cards: FSRSCard[];
}

export interface CardStatsResponse {
  total_cards: number;
  cards_by_state: Record<FSRSCardState, number>;
  due_today: number;
  average_stability_days: number;
  total_reviews: number;
  new: number;
  learning: number;
  review: number;
  relearning: number;
}

export interface OptimizeParametersRequest {
  topic_id?: string;
  min_reviews?: number;
}

// ============================================================================
// FSRS API CLIENT
// ============================================================================

export const fsrsApi = {
  /**
   * Get cards due for review
   */
  getDueCards: async (params: GetDueCardsRequest = {}): Promise<DueCardsResponse> => {
    const response = await apiClient.get<DueCardsResponse>('/api/reviews/due', {
      params: {
        limit: params.limit ?? 20,
        topic_id: params.topic_id,
        include_new: params.include_new ?? true,
      },
    });
    return response.data;
  },

  /**
   * Submit a review for a card
   */
  submitReview: async (
    cardId: string,
    review: SubmitReviewRequest
  ): Promise<ReviewSuccessResponse> => {
    const response = await apiClient.post<ReviewSuccessResponse>(
      `/api/reviews/${cardId}`,
      review
    );
    return response.data;
  },

  /**
   * Get upcoming review schedule
   */
  getUpcomingReviews: async (daysAhead: number = 7): Promise<UpcomingReviewsResponse> => {
    const response = await apiClient.get<UpcomingReviewsResponse>('/api/reviews/schedule', {
      params: { days_ahead: daysAhead },
    });
    return response.data;
  },

  /**
   * Predict current retention for a card
   */
  predictRetention: async (cardId: string): Promise<RetentionPredictionResponse> => {
    const response = await apiClient.get<RetentionPredictionResponse>(
      `/api/reviews/retention/${cardId}`
    );
    return response.data;
  },

  /**
   * Create a new review card
   */
  createCard: async (request: CreateCardRequest): Promise<FSRSCard> => {
    const response = await apiClient.post<FSRSCard>('/api/reviews/cards', request);
    return response.data;
  },

  /**
   * Bulk create review cards
   */
  bulkCreateCards: async (request: BulkCreateCardsRequest): Promise<BulkCreateCardsResponse> => {
    const response = await apiClient.post<BulkCreateCardsResponse>(
      '/api/reviews/cards/bulk',
      request
    );
    return response.data;
  },

  /**
   * Get card statistics
   */
  getCardStats: async (): Promise<CardStatsResponse> => {
    const response = await apiClient.get<CardStatsResponse>('/api/reviews/stats');
    return response.data;
  },

  /**
   * Optimize FSRS parameters from review history
   */
  optimizeParameters: async (
    request: OptimizeParametersRequest = {}
  ): Promise<FSRSParameters> => {
    const response = await apiClient.post<FSRSParameters>('/api/reviews/optimize', {
      topic_id: request.topic_id,
      min_reviews: request.min_reviews ?? 100,
    });
    return response.data;
  },
};

// ============================================================================
// CLIENT-SIDE FSRS UTILITIES (using ts-fsrs)
// ============================================================================

/**
 * Preview what would happen if a card is reviewed with a given rating.
 *
 * NOTE: Client-side ts-fsrs preview is temporarily disabled due to type complexity.
 * Use the backend API's retention prediction endpoint instead:
 * fsrsApi.predictRetention(cardId)
 *
 * TODO: Re-implement with correct ts-fsrs types once stable
 */
export async function previewReview(
  card: FSRSCard,
  rating: FSRSRating
): Promise<{
  nextReviewDate: Date;
  newStability: number;
  newDifficulty: number;
  intervalDays: number;
}> {
  // For now, just return estimated values based on current card state
  // Real preview requires backend API call
  const estimatedDays = rating === 4 ? 7 : rating === 3 ? 3 : rating === 2 ? 1 : 0;

  return {
    nextReviewDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000),
    newStability: card.stability * (rating >= 3 ? 1.2 : 0.8),
    newDifficulty: card.difficulty + (rating < 3 ? 0.5 : -0.2),
    intervalDays: estimatedDays,
  };
}

/**
 * Calculate current retention probability using FSRS formula.
 * R = 0.9^(t/S) where t = days since review, S = stability
 */
export function calculateRetention(card: FSRSCard): number {
  if (!card.last_review || card.stability === 0) {
    return 1.0; // New card, assume perfect memory
  }

  const now = new Date();
  const lastReview = new Date(card.last_review);
  const daysSinceReview = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);

  // FSRS forgetting curve: R = 0.9^(t/S)
  const retention = Math.pow(0.9, daysSinceReview / card.stability);

  return Math.max(0, Math.min(1, retention));
}

/**
 * Format interval days into human-readable string
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'now';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/**
 * Get difficulty label and color
 */
export function getDifficultyInfo(difficulty: number): {
  label: string;
  color: string;
} {
  if (difficulty < 2) return { label: 'Very Easy', color: 'text-green-600' };
  if (difficulty < 4) return { label: 'Easy', color: 'text-green-500' };
  if (difficulty < 6) return { label: 'Medium', color: 'text-yellow-500' };
  if (difficulty < 8) return { label: 'Hard', color: 'text-orange-500' };
  return { label: 'Very Hard', color: 'text-red-600' };
}

/**
 * Get retention status and color
 */
export function getRetentionInfo(retention: number): {
  label: string;
  color: string;
} {
  if (retention >= 0.9) return { label: 'Strong', color: 'text-green-600' };
  if (retention >= 0.7) return { label: 'Good', color: 'text-blue-600' };
  if (retention >= 0.5) return { label: 'Weak', color: 'text-yellow-600' };
  if (retention >= 0.3) return { label: 'Fading', color: 'text-orange-600' };
  return { label: 'Critical', color: 'text-red-600' };
}

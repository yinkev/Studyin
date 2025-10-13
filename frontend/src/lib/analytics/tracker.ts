import { apiClient } from '@/lib/api/client';

// ============================================================================
// Analytics Event Tracker
// ============================================================================

export type EventCategory = 'session' | 'material' | 'chat' | 'gamification' | 'navigation';

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface TrackEventOptions {
  silent?: boolean; // Don't log errors
  debounce?: number; // Debounce time in ms
}

// Debounce map to prevent duplicate events
const debounceMap = new Map<string, number>();

/**
 * Track an analytics event
 */
export async function trackEvent(
  event: AnalyticsEvent,
  options: TrackEventOptions = {}
): Promise<void> {
  const { silent = true, debounce = 0 } = options;

  // Generate debounce key
  const debounceKey = `${event.category}:${event.action}:${event.label ?? ''}`;

  // Check debounce
  if (debounce > 0) {
    const lastTracked = debounceMap.get(debounceKey);
    const now = Date.now();

    if (lastTracked && now - lastTracked < debounce) {
      return; // Skip duplicate event
    }

    debounceMap.set(debounceKey, now);
  }

  try {
    await apiClient.post('/api/analytics/events', {
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      metadata: event.metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (!silent) {
      console.error('[Analytics] Failed to track event:', err);
    }
  }
}

// ============================================================================
// Convenience Tracking Functions
// ============================================================================

/**
 * Track session start
 */
export function trackSessionStart(sessionId?: string): Promise<void> {
  return trackEvent({
    category: 'session',
    action: 'start',
    label: sessionId,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track session end
 */
export function trackSessionEnd(sessionId?: string, durationMs?: number): Promise<void> {
  return trackEvent({
    category: 'session',
    action: 'end',
    label: sessionId,
    value: durationMs,
    metadata: {
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track material view
 */
export function trackMaterialView(materialId: string, materialName: string): Promise<void> {
  return trackEvent(
    {
      category: 'material',
      action: 'view',
      label: materialName,
      metadata: {
        material_id: materialId,
      },
    },
    { debounce: 5000 } // Debounce 5s to prevent duplicates
  );
}

/**
 * Track material upload
 */
export function trackMaterialUpload(materialId: string, fileSize: number, fileType: string): Promise<void> {
  return trackEvent({
    category: 'material',
    action: 'upload',
    value: fileSize,
    metadata: {
      material_id: materialId,
      file_size: fileSize,
      file_type: fileType,
    },
  });
}

/**
 * Track chat message sent
 */
export function trackChatMessage(messageLength: number): Promise<void> {
  return trackEvent({
    category: 'chat',
    action: 'message_sent',
    value: messageLength,
    metadata: {
      message_length: messageLength,
    },
  });
}

/**
 * Track chat response received
 */
export function trackChatResponse(responseLength: number, latencyMs: number): Promise<void> {
  return trackEvent({
    category: 'chat',
    action: 'response_received',
    value: latencyMs,
    metadata: {
      response_length: responseLength,
      latency_ms: latencyMs,
    },
  });
}

/**
 * Track XP earned
 */
export function trackXPEarned(amount: number, source: string): Promise<void> {
  return trackEvent({
    category: 'gamification',
    action: 'xp_earned',
    label: source,
    value: amount,
    metadata: {
      xp_amount: amount,
      source,
    },
  });
}

/**
 * Track achievement unlocked
 */
export function trackAchievementUnlocked(achievementId: string, achievementTitle: string): Promise<void> {
  return trackEvent({
    category: 'gamification',
    action: 'achievement_unlocked',
    label: achievementTitle,
    metadata: {
      achievement_id: achievementId,
    },
  });
}

/**
 * Track level up
 */
export function trackLevelUp(newLevel: number): Promise<void> {
  return trackEvent({
    category: 'gamification',
    action: 'level_up',
    value: newLevel,
    metadata: {
      new_level: newLevel,
    },
  });
}

/**
 * Track streak milestone
 */
export function trackStreakMilestone(streakDays: number): Promise<void> {
  return trackEvent({
    category: 'gamification',
    action: 'streak_milestone',
    value: streakDays,
    metadata: {
      streak_days: streakDays,
    },
  });
}

/**
 * Track page navigation
 */
export function trackNavigation(fromView: string, toView: string): Promise<void> {
  return trackEvent(
    {
      category: 'navigation',
      action: 'navigate',
      label: `${fromView} -> ${toView}`,
      metadata: {
        from: fromView,
        to: toView,
      },
    },
    { debounce: 1000 } // Debounce 1s
  );
}

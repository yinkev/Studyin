/**
 * Application-wide constants and configuration values.
 *
 * This module centralizes all magic strings, numbers, and configuration values
 * used throughout the frontend application. This improves maintainability by
 * providing a single source of truth.
 *
 * Usage:
 *   import { DEFAULT_API_TIMEOUT, PROFILES, USER_LEVELS } from '@/constants';
 *
 * Organization:
 *   - API Configuration
 *   - WebSocket Configuration
 *   - Authentication
 *   - Chat & AI Coach
 *   - User Levels
 *   - File Upload
 *   - Analytics & Gamification
 */

// =============================================================================
// API Configuration
// =============================================================================

export const DEFAULT_API_TIMEOUT = 30000;
/** API request timeout in milliseconds (30 seconds) */

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
/** Maximum file upload size (50 MB) */

export const RETRY_ATTEMPTS = 3;
/** Number of retry attempts for failed requests */

export const RETRY_DELAY = 1000;
/** Delay between retry attempts in milliseconds */

// =============================================================================
// WebSocket Configuration
// =============================================================================

export const DEFAULT_WS_URL = 'ws://localhost:8000/api/chat/ws';
/** Default WebSocket URL for AI coach */

export const MAX_TOKEN_BUFFER = 8000;
/** Maximum streaming token buffer size */

export const MAX_RECONNECT_ATTEMPTS = 5;
/** Maximum WebSocket reconnection attempts */

export const RECONNECT_BASE_DELAY = 1000;
/** Base delay for reconnection backoff (milliseconds) */

export const RECONNECT_MAX_DELAY = 5000;
/** Maximum delay for reconnection backoff (milliseconds) */

export const WS_STREAM_TIMEOUT = 30000;
/** WebSocket stream timeout (30 seconds) */

// =============================================================================
// Authentication
// =============================================================================

export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
} as const;
/** Cookie names used for authentication */

export const TOKEN_REFRESH_INTERVAL = 840000;
/** Token refresh interval in milliseconds (14 minutes) */

export const TOKEN_REFRESH_BUFFER = 60000;
/** Buffer time before token expiry to trigger refresh (1 minute) */

// =============================================================================
// HTTP Methods
// =============================================================================

export const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;
/** HTTP methods that require CSRF token */

export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;
/** HTTP methods that don't modify data */

// =============================================================================
// Chat & AI Coach
// =============================================================================

export const PROFILES = {
  FAST: 'studyin_fast',
  STUDY: 'studyin_study',
  DEEP: 'studyin_deep',
} as const;
/** Codex AI profiles */

export type ProfileType = (typeof PROFILES)[keyof typeof PROFILES];

export const PROFILE_LABELS: Record<ProfileType, string> = {
  [PROFILES.FAST]: 'Fast Response',
  [PROFILES.STUDY]: 'Study Mode',
  [PROFILES.DEEP]: 'Deep Thinking',
};
/** Human-readable labels for AI profiles */

export const PROFILE_DESCRIPTIONS: Record<ProfileType, string> = {
  [PROFILES.FAST]: 'Quick answers for fast learning',
  [PROFILES.STUDY]: 'Balanced responses for studying',
  [PROFILES.DEEP]: 'Detailed explanations with deeper analysis',
};
/** Descriptions for AI profiles */

// =============================================================================
// WebSocket Message Types
// =============================================================================

export const WS_MESSAGE_TYPES = {
  INFO: 'info',
  CONTEXT: 'context',
  TOKEN: 'token',
  COMPLETE: 'complete',
  ERROR: 'error',
  USER_MESSAGE: 'user_message',
} as const;
/** WebSocket message type constants */

export type WSMessageType = (typeof WS_MESSAGE_TYPES)[keyof typeof WS_MESSAGE_TYPES];

// =============================================================================
// Connection Status
// =============================================================================

export const CONNECTION_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  READY: 'ready',
  RECONNECTING: 'reconnecting',
  CLOSED: 'closed',
  OFFLINE: 'offline',
  AUTH_ERROR: 'auth_error',
  ERROR: 'error',
} as const;
/** WebSocket connection status values */

export type ConnectionStatusType = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

// =============================================================================
// User Levels
// =============================================================================

export const USER_LEVELS = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3,
} as const;
/** User knowledge level boundaries */

export const USER_LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};
/** Human-readable labels for user levels */

export const USER_LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Just starting medical studies',
  2: 'Basic understanding of concepts',
  3: 'Medical student (Year 2-3)',
  4: 'Advanced student or resident',
  5: 'Expert knowledge level',
};
/** Descriptions for user levels */

// =============================================================================
// File Upload
// =============================================================================

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'] as const;
/** Allowed file extensions for upload */

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
] as const;
/** Allowed MIME types for upload */

export const UPLOAD_CHUNK_SIZE = 1024 * 1024;
/** File upload chunk size (1 MB) */

// =============================================================================
// Analytics & Gamification
// =============================================================================

export const ANALYTICS_EVENTS = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  CHAT_MESSAGE: 'chat_message',
  MATERIAL_UPLOAD: 'material_upload',
  QUESTION_ANSWERED: 'question_answered',
  PROFILE_CHANGED: 'profile_changed',
  LEVEL_CHANGED: 'level_changed',
} as const;
/** Analytics event type constants */

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const XP_REWARDS = {
  CHAT_MESSAGE: 5,
  MATERIAL_UPLOAD: 50,
  QUESTION_CORRECT: 20,
  QUESTION_INCORRECT: 5,
  DAILY_LOGIN: 10,
  STREAK_BONUS: 25,
} as const;
/** XP reward values for different actions */

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
/** XP thresholds for each level */

// =============================================================================
// UI Configuration
// =============================================================================

export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;
/** Toast notification durations (milliseconds) */

export const DEBOUNCE_DELAY = 300;
/** Default debounce delay for user input (milliseconds) */

export const THROTTLE_DELAY = 1000;
/** Default throttle delay for frequent actions (milliseconds) */

// =============================================================================
// Local Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_PROFILE: 'user_profile',
  USER_LEVEL: 'user_level',
  AI_PROFILE: 'ai_profile',
  THEME: 'theme',
  CHAT_HISTORY: 'chat_history',
} as const;
/** Local storage key constants */

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// =============================================================================
// Environment Detection
// =============================================================================

export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const IS_PRODUCTION = import.meta.env.MODE === 'production';
export const IS_TEST = import.meta.env.MODE === 'test';

/** Environment flags */

// =============================================================================
// Feature Flags (MVP)
// =============================================================================

export const FEATURES = {
  ENABLE_AUTH: true, // ✅ Authentication is enabled
  ENABLE_ANALYTICS: true, // ✅ Analytics tracking
  ENABLE_GAMIFICATION: true, // ✅ XP, levels, streaks
  ENABLE_OFFLINE_MODE: false, // 🚧 Not implemented yet
  ENABLE_VOICE_INPUT: false, // 🚧 Future feature
  ENABLE_COLLABORATION: false, // 🚧 Future feature
} as const;
/** Feature flags for gradual rollout */

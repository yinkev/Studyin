/**
 * Shared TypeScript type definitions.
 *
 * This module contains all reusable types used across the frontend application.
 * Types are organized by domain and include comprehensive JSDoc documentation.
 *
 * Usage:
 *   import { ChatMessage, User, APIError } from '@/types';
 */

// =============================================================================
// Common Types
// =============================================================================

export type UUID = string;
/** UUID string type (e.g., "123e4567-e89b-12d3-a456-426614174000") */

export type ISODateString = string;
/** ISO 8601 date string (e.g., "2025-10-11T12:00:00Z") */

export type Timestamp = number;
/** Unix timestamp in milliseconds */

// =============================================================================
// User & Authentication
// =============================================================================

export interface User {
  id: UUID;
  email: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface UserProfile extends User {
  level: number;
  xp: number;
  streak: number;
  lastLoginDate?: ISODateString;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  aiProfile: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailDigest: boolean;
}

// =============================================================================
// Authentication Responses
// =============================================================================

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export interface RefreshResponse {
  access_token: string;
}

export interface RegistrationResponse {
  message: string;
  user: User;
}

// =============================================================================
// Chat & Messaging
// =============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status?: MessageStatus;
  timestamp?: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface ContextChunk {
  id: string;
  filename: string;
  chunk_index: number;
  content: string;
  distance?: number | null;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// WebSocket Connection
// =============================================================================

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'reconnecting'
  | 'closed'
  | 'offline'
  | 'auth_error'
  | 'error';

export interface ChatSessionState {
  status: ConnectionStatus;
  isOnline: boolean;
  messages: ChatMessage[];
  pendingAssistant: string | null;
  contextChunks: ContextChunk[];
  lastError: string | null;
  canRetry: boolean;
  sendMessage: (content: string) => void;
  reconnect: () => void;
  retryLastMessage: () => void;
  setUserLevel: (level: number) => void;
  setProfile: (profile: string) => void;
}

// =============================================================================
// WebSocket Message Types (Server → Client)
// =============================================================================

export interface WSInfoMessage {
  type: 'info';
  message: string;
  user_id?: string;
}

export interface WSContextMessage {
  type: 'context';
  chunks: ContextChunk[];
}

export interface WSTokenMessage {
  type: 'token';
  value: string;
}

export interface WSCompleteMessage {
  type: 'complete';
  message?: string;
}

export interface WSErrorMessage {
  type: 'error';
  message: string;
}

export type WebSocketServerMessage =
  | WSInfoMessage
  | WSContextMessage
  | WSTokenMessage
  | WSCompleteMessage
  | WSErrorMessage;

// =============================================================================
// WebSocket Message Types (Client → Server)
// =============================================================================

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

export interface WSUserMessage {
  type: 'user_message';
  content: string;
  user_level: number;
  profile?: string;
  /** Optional reasoning effort; maps to gpt-5-{effort} on server */
  effort?: ReasoningEffort;
}

export type WebSocketClientMessage = WSUserMessage;

// =============================================================================
// Materials & Upload
// =============================================================================

export interface Material {
  id: UUID;
  user_id: UUID;
  filename: string;
  file_size: number;
  mime_type: string;
  upload_date: ISODateString;
  processed: boolean;
  chunk_count?: number;
  metadata?: MaterialMetadata;
}

export interface MaterialMetadata {
  original_name: string;
  upload_ip?: string;
  processing_time_ms?: number;
  error?: string;
}

export interface UploadProgress {
  filename: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// =============================================================================
// Analytics & Gamification
// =============================================================================

export interface AnalyticsEvent {
  type: string;
  timestamp: Timestamp;
  data?: Record<string, unknown>;
}

export interface StudySession {
  id: UUID;
  user_id: UUID;
  start_time: ISODateString;
  end_time?: ISODateString;
  duration_ms?: number;
  messages_sent: number;
  xp_earned: number;
}

export interface XPTransaction {
  id: UUID;
  user_id: UUID;
  amount: number;
  reason: string;
  timestamp: ISODateString;
}

export interface Streak {
  current: number;
  longest: number;
  last_activity: ISODateString;
}

// =============================================================================
// API Responses
// =============================================================================

export interface APIResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface APIError {
  detail: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =============================================================================
// Form Types
// =============================================================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdateForm {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// =============================================================================
// UI State
// =============================================================================

export type Theme = 'light' | 'dark' | 'system';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
}

// =============================================================================
// Utility Types
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>;

// =============================================================================
// Component Props Helpers
// =============================================================================

export type WithChildren<P = {}> = P & { children?: React.ReactNode };

export type WithClassName<P = {}> = P & { className?: string };

export type WithTestId<P = {}> = P & { testId?: string };

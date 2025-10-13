/**
 * Common utility functions.
 *
 * This module consolidates reusable utility functions used across the frontend.
 * Functions are organized by category and include comprehensive documentation.
 *
 * Usage:
 *   import { generateId, getCsrfToken, buildWebSocketUrl } from '@/lib/utils';
 */

import { COOKIE_NAMES } from '@/constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// =============================================================================
// CSS/Style Utilities
// =============================================================================

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 * Handles conditional classes and resolves conflicts.
 *
 * @example
 * cn('bg-red-500', isActive && 'bg-blue-500') // => 'bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generate a unique ID using crypto.randomUUID if available,
 * otherwise falls back to timestamp + random hex.
 *
 * @returns Unique identifier string
 *
 * @example
 * const id = generateId();
 * // => "a1b2c3d4-e5f6-7890-abcd-ef1234567890" or "msg_1a2b3c4d5e6f_7890ab"
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `msg_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

// =============================================================================
// Cookie Utilities
// =============================================================================

/**
 * Get CSRF token from cookies.
 * Returns null if not found or in SSR environment.
 *
 * @returns CSRF token string or null
 *
 * @example
 * const token = getCsrfToken();
 * if (token) {
 *   headers['X-CSRF-Token'] = token;
 * }
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null; // SSR environment
  }

  const match = document.cookie.match(new RegExp(`${COOKIE_NAMES.CSRF_TOKEN}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get any cookie value by name.
 *
 * @param name - Cookie name
 * @returns Cookie value or null
 *
 * @example
 * const refreshToken = getCookie('refresh_token');
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// =============================================================================
// WebSocket Utilities
// =============================================================================

/**
 * Build WebSocket URL with optional authentication token.
 * Handles both ws:// and wss:// protocols.
 *
 * @param baseUrl - Base WebSocket URL
 * @param token - Optional authentication token
 * @returns Complete WebSocket URL
 *
 * @example
 * const url = buildWebSocketUrl('ws://localhost:8000/api/chat/ws', 'token123');
 * // => 'ws://localhost:8000/api/chat/ws?token=token123'
 */
export function buildWebSocketUrl(baseUrl: string, token?: string): string {
  if (!token) {
    return baseUrl; // MVP: No token needed (hardcoded user)
  }

  const url = new URL(baseUrl);
  url.searchParams.set('token', encodeURIComponent(token));
  return url.toString();
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Truncate string to specified length with ellipsis.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 *
 * @example
 * truncate('This is a long text', 10); // => 'This is a...'
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string.
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 *
 * @example
 * capitalize('hello world'); // => 'Hello world'
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case to camelCase.
 *
 * @param str - Snake case string
 * @returns Camel case string
 *
 * @example
 * snakeToCamel('user_level'); // => 'userLevel'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// =============================================================================
// Number Utilities
// =============================================================================

/**
 * Format number with commas (e.g., 1000 => "1,000").
 *
 * @param num - Number to format
 * @returns Formatted string
 *
 * @example
 * formatNumber(1234567); // => '1,234,567'
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format bytes to human-readable size (e.g., 1024 => "1 KB").
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string
 *
 * @example
 * formatBytes(1536); // => '1.5 KB'
 * formatBytes(1048576); // => '1 MB'
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Clamp number between min and max values.
 *
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 *
 * @example
 * clamp(5, 0, 10); // => 5
 * clamp(-5, 0, 10); // => 0
 * clamp(15, 0, 10); // => 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// =============================================================================
// Date/Time Utilities
// =============================================================================

/**
 * Format ISO date string to relative time (e.g., "2 hours ago").
 *
 * @param isoString - ISO 8601 date string
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime('2025-10-11T10:00:00Z'); // => '2 hours ago'
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

/**
 * Format duration in milliseconds to human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(125000); // => '2m 5s'
 * formatDuration(3661000); // => '1h 1m 1s'
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Check if email format is valid (basic check).
 *
 * @param email - Email string to validate
 * @returns True if valid format
 *
 * @example
 * isValidEmail('user@example.com'); // => true
 * isValidEmail('invalid'); // => false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is a valid UUID.
 *
 * @param str - String to check
 * @returns True if valid UUID
 *
 * @example
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000'); // => true
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// =============================================================================
// Async Utilities
// =============================================================================

/**
 * Sleep for specified milliseconds (Promise-based delay).
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 *
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function calls.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function calls.
 *
 * @param fn - Function to throttle
 * @param limit - Minimum time between calls (ms)
 * @returns Throttled function
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// =============================================================================
// Array Utilities
// =============================================================================

/**
 * Remove duplicates from array based on key function.
 *
 * @param arr - Input array
 * @param keyFn - Function to extract comparison key
 * @returns Array with duplicates removed
 *
 * @example
 * uniqueBy([{id: 1}, {id: 2}, {id: 1}], x => x.id); // => [{id: 1}, {id: 2}]
 */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Group array items by key function.
 *
 * @param arr - Input array
 * @param keyFn - Function to extract group key
 * @returns Object with grouped items
 *
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], x => x.type);
 * // => { a: [{type: 'a', val: 1}], b: [{type: 'b', val: 2}] }
 */
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

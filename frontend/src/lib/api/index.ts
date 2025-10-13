/**
 * API client barrel exports.
 *
 * Centralized exports for all API-related modules.
 *
 * Usage:
 *   import { apiClient, authApi, refreshAccessToken } from '@/lib/api';
 */

export { apiClient, type RetriableAxiosRequestConfig } from './client';
export { authApi } from './auth';
export { refreshAccessToken } from './tokenRefresh';

import axios from 'axios';

import { authEvents } from '@/lib/events/authEvents';
import { useAuthStore } from '@/stores/authStore';

let inFlightRefresh: Promise<string> | null = null;

const REFRESH_ENDPOINT = '/api/auth/refresh';

type RefreshResponse = {
  access_token: string;
};

function extractAccessToken(data: RefreshResponse | undefined): string {
  if (!data || typeof data.access_token !== 'string' || data.access_token.length === 0) {
    throw new Error('Refresh token response did not include an access token');
  }

  return data.access_token;
}

function shouldForceLogout(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 401 || status === 403;
}

export function isRefreshInFlight(): boolean {
  return inFlightRefresh !== null;
}

export async function refreshAccessToken(): Promise<string> {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  const { setAccessToken, logout } = useAuthStore.getState();

  inFlightRefresh = (async () => {
    authEvents.emit('tokenRefreshStarted', undefined);

    try {
      const response = await axios.post<RefreshResponse>(
        `${import.meta.env.VITE_API_URL}${REFRESH_ENDPOINT}`,
        {},
        { withCredentials: true }
      );

      const accessToken = extractAccessToken(response.data);
      setAccessToken(accessToken);
      authEvents.emit('tokenRefreshSucceeded', { accessToken });
      return accessToken;
    } catch (error) {
      authEvents.emit('tokenRefreshFailed', { error });

      if (shouldForceLogout(error)) {
        logout();
      }

      throw error;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

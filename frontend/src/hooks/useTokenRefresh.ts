import { useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

import { authEvents } from '@/lib/events/authEvents';
import { refreshAccessToken, isRefreshInFlight } from '@/lib/api/tokenRefresh';
import { useAuthStore } from '@/stores/authStore';

export function useTokenRefresh(): void {
  const { accessToken, setAccessToken, logout } = useAuthStore();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectGuardRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      return () => undefined;
    }

    redirectGuardRef.current = false;

    let cancelled = false;

    try {
      const decoded = jwtDecode<{ exp: number }>(accessToken);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const refreshAt = expiresAt - 2 * 60 * 1000;
      const timeUntilRefresh = refreshAt - now;

      const triggerRefresh = async () => {
        try {
          if (isRefreshInFlight()) {
            return;
          }

          const token = await refreshAccessToken();
          if (!cancelled) {
            setAccessToken(token);
          }
        } catch (error) {
          if (!cancelled) {
            toast.error('Your session has expired. Please log in again.', {
              duration: 5000,
              action: {
                label: 'Log In',
                onClick: () => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                  }
                },
              },
            });
            logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      };

      if (timeUntilRefresh > 0) {
        refreshTimerRef.current = setTimeout(triggerRefresh, timeUntilRefresh);
      } else {
        void triggerRefresh();
      }
    } catch (error) {
      toast.error('Session error. Please log in again.');
      logout();
    }

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      redirectGuardRef.current = false;
    };
  }, [accessToken, setAccessToken, logout]);

  useEffect(() => {
    const toastId = 'token-refresh';

    const unsubscribeStart = authEvents.on('tokenRefreshStarted', () => {
      toast.loading('Refreshing session…', { id: toastId, duration: 4000 });
    });

    const unsubscribeSuccess = authEvents.on('tokenRefreshSucceeded', () => {
      redirectGuardRef.current = false;
      toast.success('Session refreshed successfully.', {
        id: toastId,
        duration: 2500,
      });
    });

    const unsubscribeFailure = authEvents.on('tokenRefreshFailed', () => {
      toast.error('Session expired. Please log in again.', {
        id: toastId,
        duration: 6000,
        action: {
          label: 'Log In',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          },
        },
      });

      if (!redirectGuardRef.current) {
        redirectGuardRef.current = true;
        logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeSuccess();
      unsubscribeFailure();
    };
  }, [logout]);
}

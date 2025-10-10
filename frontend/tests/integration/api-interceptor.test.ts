import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { describe, expect, beforeEach, test, vi } from 'vitest';

import { useAuthStore } from '@/stores/authStore';

describe('API interceptor concurrency', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null }, false);
  });

  test('queues concurrent refresh requests and refreshes once', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000');

    const { apiClient } = await import('@/lib/api/client');

    const apiMock = new MockAdapter(apiClient, { delayResponse: 10 });
    const refreshMock = new MockAdapter(axios);

    let refreshCalls = 0;
    refreshMock
      .onPost('http://localhost:8000/api/auth/refresh')
      .reply(() => {
        refreshCalls += 1;
        return [200, { access_token: 'new-token' }];
      });

    let hitCount = 0;
    apiMock.onGet('/protected').reply(() => {
      hitCount += 1;
      if (hitCount <= 2) {
        return [401, {}];
      }
      return [200, { ok: true }];
    });

    const store = useAuthStore;
    const setAccessTokenSpy = vi.spyOn(store.getState(), 'setAccessToken');
    store.setState({ accessToken: 'expired-token' }, false);

    const [responseA, responseB] = await Promise.all([
      apiClient.get('/protected'),
      apiClient.get('/protected'),
    ]);

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);
    expect(refreshCalls).toBe(1);
    expect(setAccessTokenSpy).toHaveBeenCalledWith('new-token');
    expect(store.getState().accessToken).toBe('new-token');

    apiMock.restore();
    refreshMock.restore();
    setAccessTokenSpy.mockRestore();
  });
});

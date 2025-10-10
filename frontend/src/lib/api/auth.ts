import { apiClient } from './client';

type RefreshResponse = {
  access_token: string;
};

export const authApi = {
  async refresh(): Promise<RefreshResponse> {
    const response = await apiClient.post<RefreshResponse>('/api/auth/refresh', {});
    return response.data;
  },
};

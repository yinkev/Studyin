import { apiClient } from '@/lib/api/client';

export async function getDueCount(includeNew = true): Promise<number> {
  const resp = await apiClient.get('/api/reviews/count', { params: { include_new: includeNew } });
  return Number(resp.data?.due || 0);
}


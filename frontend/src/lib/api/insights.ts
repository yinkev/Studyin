import { apiClient } from '@/lib/api/client';

export type Insight = {
  id: string;
  source: 'chat' | 'mcq' | 'manual';
  content: string;
  tags: string[];
};

export async function listInsights(params?: { q?: string; tag?: string; limit?: number }): Promise<Insight[]> {
  const response = await apiClient.get<Insight[]>('/api/insights/', { params });
  return response.data;
}

export async function createInsight(payload: { source: 'chat' | 'mcq' | 'manual'; content: string; tags?: string[] }): Promise<Insight> {
  const response = await apiClient.post<Insight>('/api/insights/', payload);
  return response.data;
}

export async function updateInsight(id: string, payload: { content?: string; tags?: string[] }): Promise<Insight> {
  const response = await apiClient.patch<Insight>(`/api/insights/${id}`, payload);
  return response.data;
}

export async function deleteInsight(id: string): Promise<void> {
  await apiClient.delete(`/api/insights/${id}`);
}


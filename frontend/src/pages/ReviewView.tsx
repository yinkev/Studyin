import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { View } from '@/components/NavBar';

type FSRSCard = {
  id: string;
  flashcard_content?: string | null;
  chunk_id?: string | null;
  topic_id?: string | null;
  due_date: string;
  state: string;
};

export function ReviewView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [cards, setCards] = useState<FSRSCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadDue = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get('/api/reviews/due', { params: { limit: 10, include_new: true } });
      setCards(resp.data.cards || []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load due cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDue().catch(()=>undefined); }, []);

  const rate = async (id: string, rating: 1|2|3|4) => {
    setSubmitting(id);
    try {
      await apiClient.post(`/api/reviews/${id}`, { rating });
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Review</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Back</Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && cards.length === 0 && (
        <div className="text-sm text-muted-foreground">No cards due. Great job!</div>
      )}
      {cards.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm whitespace-pre-wrap">{c.flashcard_content || 'Card'}</div>
            <div className="flex gap-2">
              <Button disabled={submitting===c.id} onClick={()=>rate(c.id,1)}>Again</Button>
              <Button disabled={submitting===c.id} onClick={()=>rate(c.id,2)} variant="outline">Hard</Button>
              <Button disabled={submitting===c.id} onClick={()=>rate(c.id,3)} variant="outline">Good</Button>
              <Button disabled={submitting===c.id} onClick={()=>rate(c.id,4)} variant="outline">Easy</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div>
        <Button variant="outline" onClick={loadDue} disabled={loading}>Refresh</Button>
      </div>
    </div>
  );
}

export default ReviewView;


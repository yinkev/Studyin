import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { View } from '@/components/NavBar';

type MCQ = { id: string; topic: string; stem: string; options: { text: string }[]; difficulty: number };

export function QuestionBankView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<number | ''>('');
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MCQ[]>([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = { limit };
      if (topic.trim()) params.topic = topic;
      if (difficulty !== '') params.difficulty = difficulty;
      const resp = await apiClient.get('/api/questions', { params });
      setItems(resp.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList().catch(()=>undefined); }, []);

  const practiceNext = (t: string) => {
    const qs = new URLSearchParams(window.location.search);
    qs.set('view', 'quiz');
    qs.set('topic', t);
    qs.set('mode', 'next');
    window.location.search = qs.toString();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Back</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={topic} onChange={(e)=> setTopic(e.target.value)} placeholder="Filter by topic" />
        <Input type="number" min={1} max={5} value={difficulty} onChange={(e)=> setDifficulty(e.target.value === '' ? '' : Math.min(5, Math.max(1, Number(e.target.value)||1)))} className="w-24" placeholder="Diff" />
        <Input type="number" min={1} max={200} value={limit} onChange={(e)=> setLimit(Math.min(200, Math.max(1, Number(e.target.value)||20)))} className="w-24" />
        <Button onClick={fetchList} disabled={loading}>Search</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">No questions found.</p>}

      <div className="grid gap-3">
        {items.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4 space-y-2">
              <div className="text-xs text-muted-foreground">{q.topic} • Diff {q.difficulty}/5</div>
              <div className="text-sm font-medium line-clamp-3">{q.stem}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={()=> practiceNext(q.topic)}>Practice Next</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default QuestionBankView;


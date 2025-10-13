import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { View } from '@/components/NavBar';
import { createInsight } from '@/lib/api/insights';

type MCQ = {
  id: string;
  topic: string;
  stem: string;
  options: { text: string }[];
  difficulty: number;
};

export function QuizView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [count, setCount] = useState(5);

  const hasMore = index < questions.length;
  const current = hasMore ? questions[index] : null;

  const startQuick5 = async () => {
    setLoading(true);
    setQuestions([]);
    setIndex(0);
    setChosen(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/questions/generate', { topic, difficulty, num_questions: count, use_context: true });
      setQuestions(resp.data.questions || []);
      try { localStorage.setItem('studyin_last_topic', topic); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const startNextUnanswered = async () => {
    setLoading(true);
    setQuestions([]);
    setIndex(0);
    setChosen(null);
    setResult(null);
    try {
      const resp = await apiClient.get('/api/questions/next', { params: { topic, limit: count } });
      const data = resp.data || [];
      if (data.length === 0) {
        // Fallback: generate if none pending
        await startQuick5();
      } else {
        setQuestions(data);
      }
      try { localStorage.setItem('studyin_last_topic', topic); } catch {}
    } finally {
      setLoading(false);
    }
  };

  // Auto-start if URL contains topic + mode=next
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const t = u.searchParams.get('topic');
      const mode = u.searchParams.get('mode');
      if (t && mode === 'next') {
        setTopic(t);
        startNextUnanswered();
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (chosen == null || !current) return;
    const resp = await apiClient.post(`/api/questions/${current.id}/answer`, {
      chosen_index: chosen,
    });
    setResult({ correct: !!resp.data.correct, explanation: resp.data.explanation });
  };

  const next = () => {
    setChosen(null);
    setResult(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Quick Quiz</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Back</Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <Input type="number" min={1} max={10} value={count} onChange={(e)=> setCount(Math.min(10, Math.max(1, Number(e.target.value)||5)))} className="w-20" />
        <Input type="number" min={1} max={5} value={difficulty} onChange={(e)=> setDifficulty(Math.min(5, Math.max(1, Number(e.target.value)||3)))} className="w-20" />
        <Button onClick={startQuick5} disabled={loading || !topic.trim()} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} Generate
        </Button>
        <Button onClick={startNextUnanswered} disabled={loading || !topic.trim()} variant="outline">
          Next Unanswered
        </Button>
      </div>

      {!loading && questions.length === 0 && (
        <p className="text-sm text-muted-foreground">Enter a topic and start a 5‑question quiz.</p>
      )}

      {current && (
        <Card>
          <CardContent className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">Topic: {current.topic} • Difficulty {current.difficulty}/5</p>
            <h2 className="text-lg font-semibold mb-4">{current.stem}</h2>
            <div className="grid gap-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  className={`text-left rounded-lg border px-4 py-3 ${chosen === i ? 'border-primary bg-primary/10' : 'bg-white/80'}`}
                  onClick={() => setChosen(i)}
                >
                  {String.fromCharCode(65 + i)}. {opt.text}
                </button>
              ))}
            </div>

            {!result ? (
              <div className="mt-4 flex items-center gap-2">
                <Button onClick={submit} disabled={chosen == null}>Submit</Button>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-lg border">
                <p className={result.correct ? 'text-green-700' : 'text-red-700'}>
                  {result.correct ? 'Correct!' : 'Not quite.'}
                </p>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{result.explanation}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={async ()=>{ try{ await createInsight({ source:'mcq', content: `Q: ${current.stem}\nA: ${result.explanation}` }); } catch(_){} }}>Save as Insight</Button>
                  <Button onClick={next}>Next</Button>
                  <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Finish</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default QuizView;

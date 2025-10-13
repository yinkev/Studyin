import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { View } from '@/components/NavBar';
import { createInsight } from '@/lib/api/insights';

type TeachFlow = {
  minutes: number;
  topic: string;
  skim_bullets: string[];
  key_points: string;
  mcqs: { question: string; options: string[]; correct_index: number; explanation: string }[];
  reflection_prompt: string;
};

export function FirstPassView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState<TeachFlow | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExplain, setShowExplain] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const resp = await apiClient.post('/api/teach/first-pass', null, { params: { topic, minutes } });
      setFlow(resp.data);
      setAnswers({});
      setShowExplain(false);
    } finally {
      setBusy(false);
    }
  };

  const saveKeyPoints = async () => {
    if (!flow) return;
    try { await createInsight({ source: 'manual', content: flow.key_points }); } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Guided First‑Pass</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Back</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <Input type="number" min={5} max={20} value={minutes} onChange={(e)=> setMinutes(Number(e.target.value)||10)} className="w-24" />
        <Button onClick={start} disabled={busy || !topic.trim()}>{busy ? 'Preparing…' : 'Start'}</Button>
      </div>

      {!flow && <p className="text-sm text-muted-foreground">Enter a topic and click Start to get a 10‑minute guided pass.</p>}

      {flow && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">1) Skim</h2>
              <ul className="list-disc pl-6 space-y-1">
                {flow.skim_bullets.map((b, i) => (
                  <li key={i} className="text-sm">{b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">2) Key Points</h2>
                <Button size="sm" variant="outline" onClick={saveKeyPoints}>Save as Insight</Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{flow.key_points}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">3) Quick Checks</h2>
              {flow.mcqs.map((q, qi) => (
                <div key={qi} className="border rounded-lg p-4 bg-white/80">
                  <p className="font-medium">{q.question}</p>
                  <div className="mt-2 grid gap-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        className={`text-left rounded-md border px-3 py-2 ${answers[qi] === oi ? 'border-primary bg-primary/10' : ''}`}
                        onClick={() => setAnswers((s) => ({ ...s, [qi]: oi }))}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    ))}
                  </div>
                  {showExplain && (
                    <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{q.explanation}</div>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={() => setShowExplain(true)} variant="secondary">Show Explanations</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">4) Reflect</h2>
              <p className="text-sm text-muted-foreground mb-3">{flow.reflection_prompt}</p>
              <p className="text-xs text-muted-foreground">Tip: Write 2–3 sentences, then save as an Insight.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default FirstPassView;

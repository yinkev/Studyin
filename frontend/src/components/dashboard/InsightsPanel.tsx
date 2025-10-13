import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Plus, Search, Trash2 } from 'lucide-react';
import { createInsight, deleteInsight, listInsights, type Insight } from '@/lib/api/insights';

export interface InsightsPanelProps {
  className?: string;
}

export function InsightsPanel({ className }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [newContent, setNewContent] = useState('');
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listInsights({ q: query || undefined, tag: filterTag });
      setInsights(data);
    } finally {
      setLoading(false);
    }
  }, [query, filterTag]);

  useEffect(() => {
    fetchInsights().catch(() => undefined);
  }, [fetchInsights]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const i of insights) for (const t of i.tags) s.add(t);
    return Array.from(s).sort();
  }, [insights]);

  const handleAdd = async () => {
    const content = newContent.trim();
    if (!content) return;
    const ins = await createInsight({ source: 'manual', content });
    setNewContent('');
    setInsights((prev) => [ins, ...prev]);
  };

  const handleDelete = async (id: string) => {
    await deleteInsight(id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Insights</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search insights…"
                className="pl-8 w-48"
              />
            </div>
            <Button variant="outline" onClick={() => fetchInsights()}>Search</Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Add a new insight…"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" />Add</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filterTag ? 'ghost' : 'default'}
            onClick={() => setFilterTag(undefined)}
            size="sm"
          >
            All
          </Button>
          {allTags.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={filterTag === t ? 'default' : 'ghost'}
              onClick={() => setFilterTag(t)}
              className="gap-1"
            >
              <Tag className="w-3 h-3" />{t}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insights yet. Save key ideas from chat or add your own.</p>
        ) : (
          <ul className="grid gap-3">
            {insights.map((i) => (
              <li key={i.id} className="rounded-xl border bg-white/80 p-4 flex justify-between items-start">
                <div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{i.content}</p>
                  {i.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {i.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border bg-neutral-50 text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default InsightsPanel;


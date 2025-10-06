'use client';

import { useState } from 'react';

const DEV_ENABLED =
  process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' || process.env.NEXT_PUBLIC_DEV_TOOLS === '1';

interface SearchResult {
  item_id: string;
  lo_ids?: string[];
  text: string;
  score: number;
  similarity: number;
  decay: number;
}

export default function RAGInspectorPage() {
  const [query, setQuery] = useState('');
  const [loFilter, setLoFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError('Enter a query to inspect search results.');
      return;
    }
    const params = new URLSearchParams({ q: query, k: '5' });
    if (loFilter.trim()) {
      params.set('lo', loFilter.trim());
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed (${response.status})`);
      }
      const data = await response.json();
      setResults(data?.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!DEV_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="max-w-xl text-center space-y-4 p-8 bg-slate-800/80 rounded-xl border border-slate-700">
          <h1 className="text-2xl font-bold">RAG inspector disabled</h1>
          <p className="text-sm">
            Set <code>NEXT_PUBLIC_DEV_UPLOAD=1</code> (or <code>NEXT_PUBLIC_DEV_TOOLS=1</code>) in <code>.env.local</code> to enable development tooling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Retrieval</p>
          <h1 className="text-3xl font-extrabold">Temporal RAG Inspector</h1>
          <p className="text-sm text-slate-600">
            Use this tool to probe the deterministic `/api/search` endpoint. Queries are executed locally; no external services are called.
          </p>
        </header>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Query
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="e.g., ulnar nerve claw hand"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Learning objective filter (comma separated)
            <input
              value={loFilter}
              onChange={(event) => setLoFilter(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="lo.ulnar-nerve,lo.vascular"
            />
          </label>
          <button
            type="submit"
            className="duo-button text-white text-sm px-3 py-2"
            disabled={loading}
          >
            {loading ? 'Searching…' : 'Run search'}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-3">
          {results.map((result, index) => (
            <article key={index} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
                <span className="font-semibold text-slate-700">{result.item_id}</span>
                <span>Score {result.score.toFixed(3)} · similarity {result.similarity.toFixed(3)} · decay {result.decay.toFixed(3)}</span>
              </div>
              {result.lo_ids?.length ? (
                <p className="text-xs text-slate-500">LOs: {result.lo_ids.join(', ')}</p>
              ) : null}
              <p className="text-sm text-slate-800 leading-snug">{result.text}</p>
            </article>
          ))}
          {!loading && !results.length && !error && (
            <p className="text-sm text-slate-500">Run a query to inspect evidence ranking.</p>
          )}
        </section>
      </div>
    </div>
  );
}

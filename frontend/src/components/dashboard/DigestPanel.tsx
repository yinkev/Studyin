import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';

type Digest = {
  title: string;
  bullets: string[];
  mini_case: string;
  mnemonic: string;
};

export function DigestPanel() {
  const [data, setData] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get('/api/digests/latest');
      setData(resp.data);
    } catch (e) {
      setError('Failed to load digest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest().catch(() => undefined);
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Daily Digest</h2>
          <Button size="sm" variant="outline" onClick={fetchDigest} disabled={loading}>
            Refresh
          </Button>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">{data.title}</h3>
            <ul className="list-disc pl-6 text-sm">
              {data.bullets?.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <div>
              <p className="text-sm font-semibold">Mini‑case</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.mini_case}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Mnemonic</p>
              <p className="text-sm">{data.mnemonic}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DigestPanel;


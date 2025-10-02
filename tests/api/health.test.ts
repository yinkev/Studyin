import { describe, expect, it } from 'vitest';
import { GET as healthGet } from '../../app/api/health/route';

describe('GET /api/health', () => {
  it('returns readiness flags and engine counters', async () => {
    const res = await healthGet();
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.telemetry_enabled).toBe('boolean');
    expect(typeof json.analytics_file_exists).toBe('boolean');
    expect(json).toHaveProperty('last_generated_at');
    expect(json).toHaveProperty('engine');
    expect(typeof json.engine.blueprint_ok).toBe('boolean');
    expect(typeof json.engine.items_total).toBe('number');
    expect(typeof json.engine.items_published_ok).toBe('number');
  });
});


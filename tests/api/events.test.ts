import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  appendAttempt,
  constants,
  parseAttemptEvent,
  rateLimit,
  requireAuthToken,
  telemetryEnabled,
  validateBodySize
} from '../../lib/server/events';
import { SCHEMA_VERSIONS } from '../../lib/core/schemas';

const baseAttempt = {
  schema_version: SCHEMA_VERSIONS.attemptEvent,
  app_version: '0.1.0',
  session_id: 'sess-1',
  user_id: 'user-1',
  item_id: 'item.ulnar.claw-hand',
  lo_ids: ['lo.ulnar-nerve'],
  ts_start: 1,
  ts_submit: 2,
  duration_ms: 1000,
  mode: 'learn',
  choice: 'A',
  correct: true,
  opened_evidence: false
};

describe('events helpers', () => {
  it('parses and normalises attempt events', () => {
    const parsed = parseAttemptEvent(baseAttempt);
    expect(parsed).toMatchObject({
      schema_version: SCHEMA_VERSIONS.attemptEvent,
      item_id: baseAttempt.item_id,
      correct: true
    });
  });

  it('rejects attempts with invalid schema_version', () => {
    const clone = { ...baseAttempt, schema_version: '0.9.0' };
    expect(() => parseAttemptEvent(clone)).toThrow(/schema_version mismatch/);
  });

  it('appends attempts as NDJSON lines', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'studyin-ingest-'));
    const filePath = path.join(dir, 'events.ndjson');
    const attempt = parseAttemptEvent(baseAttempt);
    await appendAttempt(attempt, filePath);
    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe(JSON.stringify(attempt) + '\n');
  });

  it('enforces token auth when configured', () => {
    process.env.INGEST_TOKEN = 'secret';
    const missing = requireAuthToken(null);
    expect(missing.ok).toBe(false);
    expect(missing.status).toBe(401);

    const wrong = requireAuthToken('Bearer nope');
    expect(wrong.ok).toBe(false);

    const ok = requireAuthToken('Bearer secret');
    expect(ok.ok).toBe(true);
    delete process.env.INGEST_TOKEN;
  });

  it('always allows requests (rate limit removed)', () => {
    const id = `client-${Date.now()}`;
    for (let i = 0; i < 1000; i++) {
      expect(rateLimit(id).ok).toBe(true);
    }
  });

  // No production enforcement: rate limiting is globally disabled.

  it('no body size limit (always ok)', () => {
    const ok = validateBodySize('x'.repeat(constants.MAX_BODY_BYTES + 10_000));
    expect(ok.ok).toBe(true);
  });

  // No body-size cap regardless of env.

  it('honours WRITE_TELEMETRY flag', () => {
    process.env.WRITE_TELEMETRY = '0';
    expect(telemetryEnabled()).toBe(false);
    process.env.WRITE_TELEMETRY = '1';
    expect(telemetryEnabled()).toBe(true);
    delete process.env.WRITE_TELEMETRY;
  });
});

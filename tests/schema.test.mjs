import { describe, it, expect } from 'vitest';
import { parseNdjsonLine, attemptEventSchema } from '../scripts/lib/schema.mjs';

describe('parseNdjsonLine', () => {
  const baseEvent = {
    schema_version: '1.0.0',
    app_version: '0.0.0',
    session_id: 'session-1',
    user_id: 'user-1',
    item_id: 'item-1',
    lo_ids: ['lo-1'],
    ts_start: 1,
    ts_submit: 2,
    duration_ms: 1000,
    mode: 'learn',
    choice: 'A',
    correct: true,
    opened_evidence: false
  };

  it('parses valid NDJSON lines', () => {
    const line = JSON.stringify(baseEvent);
    const parsed = parseNdjsonLine(line, attemptEventSchema);
    expect(parsed).toEqual(baseEvent);
  });

  it('returns null for empty lines', () => {
    expect(parseNdjsonLine('   ', attemptEventSchema)).toBeNull();
  });

  it('returns null for malformed JSON without throwing', () => {
    expect(() => parseNdjsonLine('{bad json}', attemptEventSchema)).not.toThrow();
    expect(parseNdjsonLine('{bad json}', attemptEventSchema)).toBeNull();
  });

  it('returns null when schema validation fails', () => {
    const invalid = { ...baseEvent, item_id: 123 }; // wrong type
    const line = JSON.stringify(invalid);
    expect(() => parseNdjsonLine(line, attemptEventSchema)).not.toThrow();
    expect(parseNdjsonLine(line, attemptEventSchema)).toBeNull();
  });
});

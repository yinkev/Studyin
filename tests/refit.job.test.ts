import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runRefit } from 'lib/jobs/refitWeekly';

function buildAttempt({ itemId, correct }: { itemId: string; correct: boolean }) {
  return {
    schema_version: '1.0.0',
    app_version: '0.1.0',
    session_id: 'sess-1',
    user_id: 'learner-1',
    item_id: itemId,
    lo_ids: ['lo.sample'],
    ts_start: 0,
    ts_submit: 1000,
    duration_ms: 1000,
    mode: 'learn',
    choice: 'A',
    correct,
    opened_evidence: false
  };
}

describe('runRefit', () => {
  it('writes summary JSON for provided bank/events', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'refit-test-'));
    const bankDir = path.join(tmpRoot, 'banks');
    const eventsPath = path.join(tmpRoot, 'events.ndjson');
    const outputDir = path.join(tmpRoot, 'out');

    const bankSubdir = path.join(bankDir, 'demo');
    await fs.mkdir(bankSubdir, { recursive: true });
    const itemPath = path.join(bankSubdir, 'item.demo.item.json');
    await fs.writeFile(
      itemPath,
      JSON.stringify(
        {
          id: 'item.demo',
          schema_version: '1.0.0',
          stem: 'demo',
          choices: { A: '1', B: '2', C: '3', D: '4', E: '5' },
          key: 'A',
          rationale_correct: 'because',
          rationale_distractors: { B: 'no', C: 'no', D: 'no', E: 'no' },
          los: ['lo.sample'],
          difficulty: 'medium'
        },
        null,
        2
      )
    );

    const attempts = [buildAttempt({ itemId: 'item.demo', correct: true }), buildAttempt({ itemId: 'item.demo', correct: false })];
    await fs.writeFile(eventsPath, attempts.map((event) => JSON.stringify(event)).join('\n') + '\n');

    const now = Date.parse('2025-01-01T00:00:00Z');
    const filePath = await runRefit({ bankDir, eventsPath, outputDir, now });

    const output = JSON.parse(await fs.readFile(filePath, 'utf8'));
    expect(output.refit).toHaveLength(1);
    expect(output.refit[0].itemId).toBe('item.demo');
    expect(output.refit[0].total).toBe(2);
  });
});

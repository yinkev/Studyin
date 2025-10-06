import { describe, it, expect } from 'vitest';
import { generateDeterministicEmbedding, cosineSimilarity } from '../lib/rag/embedding.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2025, 9, 6, 12, 0, 0);

function temporalDecay(ts, reference, halfLifeDays = 90) {
  if (!ts) return 1;
  const deltaDays = (reference - ts) / DAY_MS;
  const lambda = Math.log(2) / halfLifeDays;
  return Math.exp(-lambda * Math.max(0, deltaDays));
}

const CHUNKS = [
  {
    item_id: 'item.ulnar.claw-hand',
    lo_ids: ['lo.ulnar-nerve'],
    ts: NOW - DAY_MS * 2,
    embedding: generateDeterministicEmbedding('ulnar nerve claw hand sensory loss'),
    source_file: 'content/evidence/hand.pdf',
    text: 'Ulnar nerve palsy affecting claw hand patterns.'
  },
  {
    item_id: 'item.median.apb',
    lo_ids: ['lo.median-nerve'],
    ts: NOW - DAY_MS * 5,
    embedding: generateDeterministicEmbedding('median nerve recurrent branch thumb opposition'),
    source_file: 'content/evidence/hand.pdf',
    text: 'Median nerve lesion impairing thumb opposition.'
  },
  {
    item_id: 'item.shoulder.dislocation',
    lo_ids: ['lo.shoulder-anterior'],
    ts: NOW - DAY_MS * 1,
    embedding: generateDeterministicEmbedding('anterior shoulder dislocation vascular compromise'),
    source_file: 'content/evidence/shoulder.pdf',
    text: 'Anterior shoulder dislocation compromising axillary artery.'
  }
];

function rankChunks(query, { loIds = [] } = {}) {
  const queryEmbedding = generateDeterministicEmbedding(query);
  return CHUNKS.map((chunk) => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    const decay = temporalDecay(chunk.ts ?? NOW, NOW);
    const loMatchBoost = loIds.length && chunk.lo_ids
      ? chunk.lo_ids.filter((lo) => loIds.includes(lo)).length * 0.05
      : 0;
    const score = similarity * decay + loMatchBoost;
    return { ...chunk, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

describe('Deterministic RAG recall ranking', () => {
  it('prioritises the most relevant neurological chunk', () => {
    const ranked = rankChunks('ulnar nerve claw hand sensory loss');
    expect(ranked[0].item_id).toBe('item.ulnar.claw-hand');
  });

  it('respects LO filters and recent evidence boosts', () => {
    const ranked = rankChunks('anterior shoulder dislocation management', { loIds: ['lo.shoulder-anterior'] });
    expect(ranked[0].item_id).toBe('item.shoulder.dislocation');
    expect(ranked[1].score).toBeLessThan(ranked[0].score);
  });
});

import { describe, it, expect } from 'vitest';
import { generateDeterministicEmbedding, cosineSimilarity } from '../lib/rag/embedding.mjs';

describe('deterministic embeddings', () => {
  it('returns consistent vectors', () => {
    const first = generateDeterministicEmbedding('ulnar nerve');
    const second = generateDeterministicEmbedding('ulnar nerve');
    expect(first).toEqual(second);
  });

  it('provides cosine similarity in expected range', () => {
    const a = generateDeterministicEmbedding('ulnar nerve injury');
    const b = generateDeterministicEmbedding('median nerve injury');
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });
});

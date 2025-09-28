const DIMENSIONS = 64;

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

export function generateDeterministicEmbedding(text, dimensions = DIMENSIONS) {
  const base = hashString(text);
  const vector = new Array(dimensions);
  let seed = base || 1;
  for (let i = 0; i < dimensions; i += 1) {
    seed = (seed * 1664525 + 1013904223) % 0xffffffff;
    const value = (seed / 0xffffffff) * 2 - 1;
    vector[i] = Number(value.toFixed(6));
  }
  return vector;
}

export function cosineSimilarity(a, b) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const EMBEDDING_DIMENSIONS = DIMENSIONS;

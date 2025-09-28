declare module '../../lib/rag/embedding.mjs' {
  export const EMBEDDING_DIMENSIONS: number;
  export function generateDeterministicEmbedding(text: string, dimensions?: number): number[];
  export function cosineSimilarity(a: number[], b: number[]): number;
}
declare module '../../../lib/rag/embedding.mjs' {
  export const EMBEDDING_DIMENSIONS: number;
  export function generateDeterministicEmbedding(text: string, dimensions?: number): number[];
  export function cosineSimilarity(a: number[], b: number[]): number;
}

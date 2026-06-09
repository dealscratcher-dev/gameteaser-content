// similarity.ts – utilities for computing similarity between feature vectors

/** Compute cosine similarity between two numeric vectors.
 * Returns a value between -1 (opposite) and 1 (identical). Handles unequal lengths
 * by truncating to the shortest vector.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Euclidean distance between two vectors (used for alternative similarity metric). */
export function euclideanDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/** Simple helper that returns a similarity score (0‑1) based on cosine similarity. */
export function similarityScore(a: number[], b: number[]): number {
  const cos = cosineSimilarity(a, b);
  // Transform from [-1,1] to [0,1]
  return (cos + 1) / 2;
}

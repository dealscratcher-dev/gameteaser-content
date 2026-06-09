// related.ts – recommendation utilities for items similar to a target item

export interface SimilarItem {
  id: string;
  title: string;
  // Feature vector used for similarity comparison (e.g., embeddings)
  vector: number[];
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1 (higher = more similar).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Return up to `count` items that are most similar to the item with `targetId`.
 * The target item must exist within `items`; otherwise an empty array is returned.
 */
export function getRelatedRecommendations(
  targetId: string,
  items: SimilarItem[],
  count: number = 5
): SimilarItem[] {
  const target = items.find((it) => it.id === targetId);
  if (!target) return [];

  const scored = items
    .filter((it) => it.id !== targetId)
    .map((it) => ({ item: it, score: cosineSimilarity(target.vector, it.vector) }));

  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.slice(0, count).map((s) => s.item);
}

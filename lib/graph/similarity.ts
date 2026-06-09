// lib/graph/similarity.ts

/**
 * Compute Jaccard similarity between two arrays of strings (tags).
 * Returns a value in the range [0, 1].
 */
export function computeJaccardSimilarity(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Weighted similarity that combines tag Jaccard with optional genre and author overlap.
 * `genreWeight` and `authorWeight` are fractions of the final score (default 0.2 each).
 */
export function computeWeightedSimilarity(params: {
  tagsA: readonly string[];
  tagsB: readonly string[];
  genreA?: string;
  genreB?: string;
  authorIdA?: string | number;
  authorIdB?: string | number;
  tagWeight?: number;
  genreWeight?: number;
  authorWeight?: number;
}): number {
  const {
    tagsA,
    tagsB,
    genreA,
    genreB,
    authorIdA,
    authorIdB,
    tagWeight = 0.6,
    genreWeight = 0.2,
    authorWeight = 0.2,
  } = params;

  const tagScore = computeJaccardSimilarity(tagsA, tagsB);
  const genreScore = genreA && genreB && genreA === genreB ? 1 : 0;
  const authorScore = authorIdA && authorIdB && `${authorIdA}` === `${authorIdB}` ? 1 : 0;

  return tagScore * tagWeight + genreScore * genreWeight + authorScore * authorWeight;
}

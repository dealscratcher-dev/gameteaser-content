// lib/recommendations/bandit.ts
/**
 * Simple ε‑greedy multi‑armed bandit selector.
 * Deterministic for a given random seed; here we use Math.random().
 * The function can be used client‑side or server‑side to decide whether
 * to explore (pick a random candidate) or exploit (pick the highest‑scoring
 * candidate).
 */

/**
 * Select an item using ε‑greedy strategy.
 *
 * @param candidateIds  Array of candidate content IDs.
 * @param scores        Parallel array of numeric scores (higher = better).
 * @param epsilon       Exploration probability (default 0.1).
 * @returns             Chosen content ID.
 */
export function selectItemEpsilonGreedy(
  candidateIds: (string | number)[],
  scores: number[],
  epsilon: number = 0.1,
): string | number {
  if (candidateIds.length !== scores.length) {
    throw new Error("candidateIds and scores must have the same length");
  }
  if (candidateIds.length === 0) {
    throw new Error("No candidates provided");
  }

  // Exploration step
  if (Math.random() < epsilon) {
    const randIdx = Math.floor(Math.random() * candidateIds.length);
    return candidateIds[randIdx];
  }

  // Exploitation – pick the index with max score (first occurrence wins)
  let maxIdx = 0;
  let maxScore = scores[0];
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
      maxIdx = i;
    }
  }
  return candidateIds[maxIdx];
}

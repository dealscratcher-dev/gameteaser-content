// bandit.ts – simple multi‑armed bandit (Thompson sampling) for recommendations

export interface BanditItem {
  id: string;
  title: string;
  // Number of successes (e.g., likes) and failures (e.g., skips)
  successes: number;
  failures: number;
}

/**
 * Draw a random value from a Beta(alpha, beta) distribution.
 * Uses the mean of Beta as an approximation for simplicity.
 * For a proper implementation you could import a random‑beta library.
 */
function betaSample(alpha: number, beta: number): number {
  // Approximate Beta by (alpha / (alpha + beta))
  return alpha / (alpha + beta);
}

/**
 * Return the top `count` items using Thompson sampling.
 * Items with higher success rates are more likely to be selected.
 */
export function getBanditRecommendations(
  items: BanditItem[],
  count: number = 5
): BanditItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Compute a sample score for each item
  const scored = items.map((it) => {
    const alpha = it.successes + 1; // add 1 for prior
    const beta = it.failures + 1;
    return { item: it, score: betaSample(alpha, beta) };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.slice(0, count).map((s) => s.item);
}

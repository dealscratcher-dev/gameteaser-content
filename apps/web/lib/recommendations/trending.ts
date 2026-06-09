// trending.ts – recommendation utilities based on recent activity

export interface TrendItem {
  id: string;
  title: string;
  recentScore: number; // e.g., likes or views in the last 24h
}

/**
 * Return the top `count` trending items sorted by `recentScore` descending.
 */
export function getTrendingRecommendations(
  items: TrendItem[],
  count: number = 10
): TrendItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.recentScore - a.recentScore);
  return sorted.slice(0, count);
}

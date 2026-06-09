// coldstart.ts – simple cold‑start recommendation utilities

export interface Item {
  id: string;
  title: string;
  popularity: number; // higher = more popular
}

/**
 * Return the top `count` items sorted by popularity descending.
 * If fewer items are available, the whole list is returned.
 */
export function getColdStartRecommendations(
  items: Item[],
  count: number = 10
): Item[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.popularity - a.popularity);
  return sorted.slice(0, count);
}

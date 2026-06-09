// lib/recommendations/trending.ts
/**
 * Trending recommendation utilities.
 *
 * The implementation prefers Redis sorted‑sets for fast retrieval of
 * time‑decayed view scores. If Redis is unavailable or the sorted set
 * does not exist, it falls back to a simple PostgreSQL query ordered by
 * `view_count` (most recent may also be considered).
 */

import type { ContentBase } from "../content";

// Placeholder imports – replace with your actual DB/Redis clients.
// The project likely already provides a pgPool and a redisClient.
// We type them as `any` to avoid compile‑time errors if the modules
// are not present in this repository.
const pgPool: any = require("../../../../db").pgPool; // adjust if needed
const redisClient: any = require("../../../../redis").redisClient; // adjust if needed

/**
 * Get the top‑N trending items for a given content type.
 *
 * @param type   Content type (e.g., "universe", "character", "release").
 * @param limit  Maximum number of items to return.
 * @returns      Array of ContentBase objects sorted by the trending score.
 */
export async function getTrendingContent(
  type: string,
  limit: number = 10,
): Promise<ContentBase[]> {
  // Try Redis first – sorted set key pattern: `trending:<type>`
  if (redisClient && typeof redisClient.zrevrange === "function") {
    try {
      const ids: string[] = await redisClient.zrevrange(`trending:${type}`, 0, limit - 1);
      if (ids.length) {
        const { rows } = await pgPool.query(
          `SELECT * FROM content WHERE id = ANY($1::uuid[])`,
          [ids],
        );
        // Preserve order returned by Redis
        const idMap = new Map<string, any>();
        rows.forEach((row: any) => idMap.set(row.id, row));
        return ids.map((id) => idMap.get(id) as ContentBase).filter(Boolean);
      }
    } catch (e) {
      console.warn("Redis trending lookup failed, falling back to PG", e);
    }
  }

  // Fallback: simple view_count ordering (most viewed) for the type.
  const { rows } = await pgPool.query(
    `SELECT * FROM content WHERE type = $1 ORDER BY view_count DESC LIMIT $2`,
    [type, limit],
  );
  return rows as ContentBase[];
}

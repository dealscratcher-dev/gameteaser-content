// lib/recommendations/coldstart.ts
/**
 * Cold‑start recommendation utilities.
 * When a user has no interaction history we fall back to globally popular
 * items, optionally filtered by the user’s known preferred categories.
 */

import type { ContentBase } from "../content";

// Placeholder DB client – replace with actual implementation.
const pgPool: any = require("../../../../db").pgPool;

/**
 * Get cold‑start recommendations.
 *
 * @param db        PostgreSQL client with a `query` method.
 * @param userId    Optional user identifier. If provided we try to fetch
 *                  the user's favorite categories from `user_preferences`.
 * @param limit     Number of items to return (default 10).
 * @returns         Array of ContentBase records.
 */
export async function getColdStartRecommendations(
  db: { query: (sql: string, params?: any[]) => Promise<any> },
  userId?: string | number,
  limit: number = 10,
): Promise<ContentBase[]> {
  // 1️⃣ If we have a user, attempt to pull their preferred categories.
  if (userId) {
    const prefSql = `
      SELECT category_id
      FROM user_preferences
      WHERE user_id = $1
      ORDER BY weight DESC
      LIMIT 3;
    `;
    const prefResult = await db.query(prefSql, [userId]);
    const categories = prefResult.rows.map((r: any) => r.category_id);
    if (categories.length) {
      const catSql = `
        SELECT * FROM content
        WHERE category_id = ANY($1::uuid[])
        ORDER BY view_count DESC
        LIMIT $2;
      `;
      const catResult = await db.query(catSql, [categories, limit]);
      if (catResult.rows.length) return catResult.rows as ContentBase[];
    }
  }

  // 2️⃣ Global most‑viewed fallback.
  const globalSql = `
    SELECT * FROM content
    ORDER BY view_count DESC
    LIMIT $1;
  `;
  const globalResult = await db.query(globalSql, [limit]);
  return globalResult.rows as ContentBase[];
}

// lib/recommendations/related.ts
import type { ContentBase } from "../content";
import type { Relation } from "../graph/relationships";

/**
 * Retrieves related content for a given content ID.
 *
 * The function queries a relational table `content_relations` that stores
 * pre‑computed directed edges between content items. The query is deterministic
 * and does not rely on any probabilistic model.
 *
 * @param db   PostgreSQL client that implements a minimal `query` method.
 * @param contentId ID of the source content.
 * @param limit    Maximum number of related items to return (default 10).
 * @returns        Array of related content records ordered by weight.
 */
export async function getRelatedContent(
  db: { query: (sql: string, params?: any[]) => Promise<any> },
  contentId: string,
  limit: number = 10
): Promise<ContentBase[]> {
  const sql = `
    SELECT c.*
    FROM content_relations r
    JOIN content c ON c.id = r.target_id
    WHERE r.source_id = $1
      AND r.type IN ('similar', 'co_view')
    ORDER BY r.weight DESC
    LIMIT $2;
  `;
  const result = await db.query(sql, [contentId, limit]);
  // Assuming the client returns rows array
  return result.rows as ContentBase[];
}

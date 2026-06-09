// lib/content.ts

/**
 * Core content data contract used across the recommendation engine.
 * All content types (Universe, Character, Release) share these fields.
 */
export interface ContentBase {
  /** Unique identifier (UUID or numeric) */
  id: string;
  /** Human‑readable title */
  title: string;
  /** Type discriminator: "universe" | "character" | "release" */
  type: "universe" | "character" | "release";
  /** Array of tags/keywords associated with the content */
  tags: string[];
  /** Primary genre (optional) */
  genre?: string;
  /** Author or creator identifier (optional) */
  authorId?: string | number;
  /** Creation timestamp */
  createdAt: Date;
  /** Number of views – used for trending calculations */
  viewCount: number;
}

/**
 * Convert a generic DB row (any) into a ContentBase.
 * The function is tolerant to missing fields and performs minimal type‑casting.
 */
export function toContentBase(row: any): ContentBase {
  return {
    id: String(row.id ?? row.content_id ?? ""),
    title: String(row.title ?? row.name ?? row.slug ?? ""),
    type: (row.type ?? row.content_type ?? "universe") as ContentBase["type"],
    tags: Array.isArray(row.tags) ? row.tags : (row.tags?.split(',') ?? []),
    genre: row.genre ?? undefined,
    authorId: row.author_id ?? row.creator_id ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    viewCount: Number(row.view_count ?? row.views ?? 0),
  };
}

// apps/web/lib/repositories/news.repo.ts

import { createServerSupabaseClient, query, queryNullable } from "../supabase";
import type { NewsRow, NewsFeedView, Inserts } from "@db/database.types";

export interface ListNewsOptions {
  universeId?: string;
  search?: string;
  tags?: string[];
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export const newsRepo = {
  // ── List news (feed view – includes author + universe info) ─────────────────
  async list(opts: ListNewsOptions = {}): Promise<NewsFeedView[]> {
    const supabase = await createServerSupabaseClient();
    const {
      universeId,
      search,
      tags,
      publishedOnly = true,
      limit = 20,
      offset = 0,
    } = opts;

    let q = supabase
      .from("news_feed")
      .select("*")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (publishedOnly)    q = q.eq("is_published", true);
    if (universeId)       q = q.eq("universe_id", universeId);
    if (tags?.length)     q = q.overlaps("tags", tags);
    if (search)           q = q.textSearch("fts", search, { type: "websearch" });

    return query(() => q);
  },

  // ── Get by slug (feed view) ─────────────────────────────────────────────────
  async bySlug(slug: string): Promise<NewsFeedView | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("news_feed")
        .select("*")
        .eq("slug", slug)
        .single()
    );
  },

  // ── Get by id (base table) ──────────────────────────────────────────────────
  async byId(id: string): Promise<NewsRow | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single()
    );
  },

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(data: Inserts<"news">): Promise<NewsRow> {
    const supabase = await createServerSupabaseClient();
    return query(() =>
      supabase
        .from("news")
        .insert(data as never)
        .select()
        .single()
    );
  },

  // ── Increment view count ────────────────────────────────────────────────────
  async incrementViewCount(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const client = supabase as unknown as {
      rpc: (fn: string, args: Record<string, string>) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await client.rpc("increment_news_view_count", { news_id: id });
    // Graceful degradation – view count is not critical
    if (error) console.warn("incrementViewCount RPC failed:", error.message);
  },
};

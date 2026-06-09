// apps/web/lib/repositories/universes.repo.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Supabase queries for universes + universe_follows.
// Server-side only – import in Route Handlers and Server Components.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerSupabaseClient, query, queryNullable } from "../supabase";
import type {
  UniverseRow,
  UniverseCardView,
  UniverseFollowRow,
  Inserts,
  UniverseGenre,
} from "@db/database.types";

// ── List options ──────────────────────────────────────────────────────────────
export interface ListUniversesOptions {
  genre?: UniverseGenre;
  tags?: string[];           // overlap match (&&)
  search?: string;           // full-text search via fts column
  limit?: number;
  offset?: number;
  orderBy?: "follower_count" | "character_count" | "release_count" | "created_at";
  orderDir?: "asc" | "desc";
}

// ── Repository ────────────────────────────────────────────────────────────────
export const universesRepo = {
  // ── List universes (card view) ──────────────────────────────────────────────
  async list(opts: ListUniversesOptions = {}): Promise<UniverseCardView[]> {
    const supabase = await createServerSupabaseClient();
    const {
      genre,
      tags,
      search,
      limit = 20,
      offset = 0,
      orderBy = "follower_count",
      orderDir = "desc",
    } = opts;

    let q = supabase
      .from("universe_cards")
      .select("*")
      .order(orderBy, { ascending: orderDir === "asc" })
      .range(offset, offset + limit - 1);

    if (genre)  q = q.eq("genre", genre);
    if (tags?.length) q = q.overlaps("tags", tags);
    if (search) q = q.textSearch("fts", search, { type: "websearch" });

    return query(() => q);
  },

  // ── Get single universe by slug ─────────────────────────────────────────────
  async bySlug(slug: string): Promise<UniverseRow | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("universes")
        .select("*")
        .eq("slug", slug)
        .single()
    );
  },

  // ── Get single universe by id ───────────────────────────────────────────────
  async byId(id: string): Promise<UniverseRow | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("universes")
        .select("*")
        .eq("id", id)
        .single()
    );
  },

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(data: Inserts<"universes">): Promise<UniverseRow> {
    const supabase = await createServerSupabaseClient();
    return query(() =>
      supabase
        .from("universes")
        .insert(data as never)
        .select()
        .single()
    );
  },

  // ── Follow ──────────────────────────────────────────────────────────────────
  async follow(userId: string, universeId: string): Promise<UniverseFollowRow> {
    const supabase = await createServerSupabaseClient();
    return query(() =>
      supabase
        .from("universe_follows")
        .insert({ user_id: userId, universe_id: universeId } as never)
        .select()
        .single()
    );
  },

  // ── Unfollow ────────────────────────────────────────────────────────────────
  async unfollow(userId: string, universeId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("universe_follows")
      .delete()
      .eq("user_id", userId)
      .eq("universe_id", universeId);
    if (error) throw new Error(`unfollow failed: ${error.message}`);
  },

  // ── Check follow status ─────────────────────────────────────────────────────
  async isFollowing(userId: string, universeId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase
      .from("universe_follows")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("universe_id", universeId);
    if (error) throw new Error(`isFollowing failed: ${error.message}`);
    return (count ?? 0) > 0;
  },

  // ── Get user's followed universes ───────────────────────────────────────────
  async followedByUser(userId: string): Promise<UniverseCardView[]> {
    const supabase = await createServerSupabaseClient();
    // Join via universe_follows → universe_cards
    return query(() =>
      supabase
        .from("universe_follows")
        .select("universe_id, universe_cards(*)")
        .eq("user_id", userId)
        .then(({ data, error }) => ({
          data: data?.map((r: { universe_cards: UniverseCardView }) => r.universe_cards).filter(Boolean) ?? null,
          error,
        }))
    );
  },
};

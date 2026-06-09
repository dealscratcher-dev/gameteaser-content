// apps/web/lib/repositories/characters.repo.ts

import { createServerSupabaseClient, query, queryNullable } from "../supabase";
import type {
  CharacterRow,
  CharacterDetailView,
  CharacterLikeRow,
  Inserts,
} from "@db/database.types";

export interface ListCharactersOptions {
  universeId?: string;
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
  orderBy?: "like_count" | "name" | "created_at";
  orderDir?: "asc" | "desc";
}

export const charactersRepo = {
  // ── List characters (detail view – includes universe info) ──────────────────
  async list(opts: ListCharactersOptions = {}): Promise<CharacterDetailView[]> {
    const supabase = await createServerSupabaseClient();
    const {
      universeId,
      search,
      role,
      limit = 20,
      offset = 0,
      orderBy = "like_count",
      orderDir = "desc",
    } = opts;

    let q = supabase
      .from("character_details")
      .select("*")
      .order(orderBy, { ascending: orderDir === "asc" })
      .range(offset, offset + limit - 1);

    if (universeId) q = q.eq("universe_id", universeId);
    if (role)       q = q.eq("role", role);
    if (search)     q = q.textSearch("fts", search, { type: "websearch" });

    return query(() => q);
  },

  // ── Get by slug ─────────────────────────────────────────────────────────────
  async bySlug(slug: string): Promise<CharacterDetailView | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("character_details")
        .select("*")
        .eq("slug", slug)
        .single()
    );
  },

  // ── Get by id (base table, not view) ───────────────────────────────────────
  async byId(id: string): Promise<CharacterRow | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single()
    );
  },

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(data: Inserts<"characters">): Promise<CharacterRow> {
    const supabase = await createServerSupabaseClient();
    return query(() =>
      supabase
        .from("characters")
        .insert(data as never)
        .select()
        .single()
    );
  },

  // ── Like ────────────────────────────────────────────────────────────────────
  async like(userId: string, characterId: string): Promise<CharacterLikeRow> {
    const supabase = await createServerSupabaseClient();
    return query(() =>
      supabase
        .from("character_likes")
        .insert({ user_id: userId, character_id: characterId } as never)
        .select()
        .single()
    );
  },

  // ── Unlike ──────────────────────────────────────────────────────────────────
  async unlike(userId: string, characterId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("character_likes")
      .delete()
      .eq("user_id", userId)
      .eq("character_id", characterId);
    if (error) throw new Error(`unlike failed: ${error.message}`);
  },

  // ── Check like status ───────────────────────────────────────────────────────
  async isLiked(userId: string, characterId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase
      .from("character_likes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("character_id", characterId);
    if (error) throw new Error(`isLiked failed: ${error.message}`);
    return (count ?? 0) > 0;
  },

  // ── Get liked characters for a user ────────────────────────────────────────
  async likedByUser(userId: string): Promise<CharacterDetailView[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("character_likes")
      .select("character_id, character_details(*)")
      .eq("user_id", userId);
    if (error) throw new Error(`likedByUser failed: ${error.message}`);
    return (
      (data ?? [])
        .map((r: { character_details: CharacterDetailView }) => r.character_details)
        .filter(Boolean) as CharacterDetailView[]
    );
  },
};

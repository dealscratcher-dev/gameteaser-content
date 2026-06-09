// apps/web/lib/repositories/bookmarks.repo.ts

import { createServerSupabaseClient, query, queryNullable } from "../supabase";
import type { BookmarkRow, EntityType, Json, Inserts } from "@db/database.types";

export interface ListBookmarksOptions {
  entityType?: EntityType;
  limit?: number;
  offset?: number;
}

export const bookmarksRepo = {
  // ── Add bookmark ────────────────────────────────────────────────────────────
  async add(
    userId: string,
    entityType: EntityType,
    entityId: string,
    metadata: Json = {}
  ): Promise<BookmarkRow> {
    const supabase = await createServerSupabaseClient();
    const payload: Inserts<"bookmarks"> = {
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    };
    const { data, error } = await supabase
      .from("bookmarks")
      .insert(payload as never)
      .select()
      .single();
    if (error) throw new Error(`addBookmark failed: ${error.message}`);
    if (!data) throw new Error("addBookmark returned null data");
    return data;
  },

  // ── Remove bookmark ─────────────────────────────────────────────────────────
  async remove(userId: string, entityType: EntityType, entityId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) throw new Error(`removeBookmark failed: ${error.message}`);
  },

  // ── Check bookmark ──────────────────────────────────────────────────────────
  async isBookmarked(
    userId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<boolean> {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) throw new Error(`isBookmarked failed: ${error.message}`);
    return (count ?? 0) > 0;
  },

  // ── Get single bookmark ─────────────────────────────────────────────────────
  async get(
    userId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<BookmarkRow | null> {
    const supabase = await createServerSupabaseClient();
    return queryNullable(() =>
      supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .single()
    );
  },

  // ── List bookmarks for a user ───────────────────────────────────────────────
  async listForUser(
    userId: string,
    opts: ListBookmarksOptions = {}
  ): Promise<BookmarkRow[]> {
    const supabase = await createServerSupabaseClient();
    const { entityType, limit = 20, offset = 0 } = opts;

    let q = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) q = q.eq("entity_type", entityType);

    return query(() => q);
  },

  // ── Toggle bookmark (add if missing, remove if present) ─────────────────────
  async toggle(
    userId: string,
    entityType: EntityType,
    entityId: string,
    metadata?: Json
  ): Promise<{ bookmarked: boolean }> {
    const already = await this.isBookmarked(userId, entityType, entityId);
    if (already) {
      await this.remove(userId, entityType, entityId);
      return { bookmarked: false };
    }
    await this.add(userId, entityType, entityId, metadata);
    return { bookmarked: true };
  },
};

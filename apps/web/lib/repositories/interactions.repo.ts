// apps/web/lib/repositories/interactions.repo.ts

import { createServerSupabaseClient, query } from "../supabase";
import type {
  UserInteractionRow,
  EntityType,
  InteractionType,
  Json,
} from "@db/database.types";

export interface TrackInteractionInput {
  userId?: string | null;   // null = anonymous
  entityType: EntityType;
  entityId: string;
  interactionType: InteractionType;
  payload?: Json;
}

export interface ListInteractionsOptions {
  entityType?: EntityType;
  interactionType?: InteractionType;
  limit?: number;
  offset?: number;
}

export const interactionsRepo = {
  // ── Track an interaction ────────────────────────────────────────────────────
  async track(input: TrackInteractionInput): Promise<UserInteractionRow> {
    const supabase = await createServerSupabaseClient();
    return query(() =>
      supabase
        .from("user_interactions")
        .insert({
          user_id:          input.userId ?? null,
          entity_type:      input.entityType,
          entity_id:        input.entityId,
          interaction_type: input.interactionType,
          payload:          input.payload ?? {},
        } as never)
        .select()
        .single()
    );
  },

  // ── Fire-and-forget tracking (never throws – safe to call from UI) ──────────
  async trackSilent(input: TrackInteractionInput): Promise<void> {
    try {
      await this.track(input);
    } catch (err) {
      console.warn("interaction tracking failed (non-critical):", err);
    }
  },

  // ── Count interactions for an entity ───────────────────────────────────────
  async countForEntity(
    entityId: string,
    interactionType: InteractionType
  ): Promise<number> {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase
      .from("user_interactions")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", entityId)
      .eq("interaction_type", interactionType);
    if (error) throw new Error(`countForEntity failed: ${error.message}`);
    return count ?? 0;
  },

  // ── List interactions for a user ────────────────────────────────────────────
  async listForUser(
    userId: string,
    opts: ListInteractionsOptions = {}
  ): Promise<UserInteractionRow[]> {
    const supabase = await createServerSupabaseClient();
    const { entityType, interactionType, limit = 50, offset = 0 } = opts;

    let q = supabase
      .from("user_interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType)      q = q.eq("entity_type", entityType);
    if (interactionType) q = q.eq("interaction_type", interactionType);

    return query(() => q);
  },
};

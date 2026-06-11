"use server";

import { createAdminSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { Database } from "../../../../../packages/db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentItemRow } from "@/types";

const getAdminClient = () => createAdminSupabaseClient() as unknown as SupabaseClient<Database>;

type SectionRoute = "curated-drops" | "upcoming-drops" | "hologram-roster" | "auto";

/**
 * Maps section route to content priority metadata.
 * `featured` is only set explicitly for curated-drops; all other routes leave it untouched (null).
 */
function getRouteMetadata(route: SectionRoute): {
  featured: boolean | null;
  section_hint: string | null;
  priority: number | null;
} {
  switch (route) {
    case "curated-drops":
      return { featured: true, section_hint: "curated-drops", priority: 1 };
    case "upcoming-drops":
      return { featured: null, section_hint: "upcoming-drops", priority: 2 };
    case "hologram-roster":
      return { featured: null, section_hint: "hologram-roster", priority: 3 };
    case "auto":
    default:
      return { featured: null, section_hint: null, priority: null };
  }
}

/**
 * Approves a content draft by moving its status to published.
 * Stores the section routing preference in metadata.
 * Bypasses RLS using the admin client.
 */
export async function approveContent(id: string, route: SectionRoute = "auto") {
  // TODO: Add admin authentication check once authentication is integrated.
  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const { featured, section_hint, priority } = getRouteMetadata(route);

    const updatePayload: Record<string, unknown> = {
      status: "published",
      published_at: now,
      updated_at: now,
      // Only write `featured` when we have an explicit value; avoids overwriting existing flags
      ...(featured !== null && { featured }),
      // Only write `metadata` for non-auto routes
      ...(route !== "auto" && {
        metadata: {
          section_route: route,
          section_hint,
          priority,
          routed_at: now,
        },
      }),
    };

    const { error: updateError } = await (supabase
      .from("content_items") as any)
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("[approveContent] update error:", updateError);
      return { error: updateError.message };
    }

    // Insert content_reviews row with route annotation
    const { error: reviewError } = await (supabase
      .from("content_reviews") as any)
      .insert({
        content_id: id,
        review_status: "approved",
        notes:
          route !== "auto"
            ? `Routed to section: ${route}`
            : "Auto-routed by system",
      });

    if (reviewError) {
      console.error("[approveContent] review insert error:", reviewError);
      return { error: reviewError.message };
    }

    revalidatePath("/admin/review");
    revalidatePath("/");

    console.log(`[approveContent] Content ${id} approved and routed to: ${route}`);
    return { success: true, route };
  } catch (err: any) {
    console.error("[approveContent] unhandled exception:", err);
    return { error: err.message || "Failed to approve content" };
  }
}

/**
 * Rejects a content draft.
 */
export async function rejectContent(id: string) {
  // TODO: Add admin authentication check once authentication is integrated.
  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();

    const { error: updateError } = await (supabase
      .from("content_items") as any)
      .update({
        status: "rejected",
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[rejectContent] update error:", updateError);
      return { error: updateError.message };
    }

    const { error: reviewError } = await (supabase
      .from("content_reviews") as any)
      .insert({
        content_id: id,
        review_status: "rejected",
      });

    if (reviewError) {
      console.error("[rejectContent] review insert error:", reviewError);
      return { error: reviewError.message };
    }

    revalidatePath("/admin/review");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("[rejectContent] unhandled exception:", err);
    return { error: err.message || "Failed to reject content" };
  }
}

/**
 * Flags content as requiring changes, adding notes to the draft.
 */
export async function needsChangesContent(id: string, notes: string) {
  // TODO: Add admin authentication check once authentication is integrated.
  if (!notes.trim()) {
    return { error: "Notes are required to request changes." };
  }

  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();

    const { error: updateError } = await (supabase
      .from("content_items") as any)
      .update({
        status: "draft",
        review_notes: notes,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[needsChangesContent] update error:", updateError);
      return { error: updateError.message };
    }

    const { error: reviewError } = await (supabase
      .from("content_reviews") as any)
      .insert({
        content_id: id,
        review_status: "needs_changes",
        notes,
      });

    if (reviewError) {
      console.error("[needsChangesContent] review insert error:", reviewError);
      return { error: reviewError.message };
    }

    revalidatePath("/admin/review");

    return { success: true };
  } catch (err: any) {
    console.error("[needsChangesContent] unhandled exception:", err);
    return { error: err.message || "Failed to request changes" };
  }
}

/**
 * Updates a content draft with admin edits.
 * Preserves the original IGDB payload inside metadata.original_source_payload.
 */
export async function updateContentDraft(
  id: string,
  changes: Partial<ContentItemRow>
) {
  // TODO: Add admin authentication check once authentication is integrated.
  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();

    // Fetch existing row so we can preserve original_source_payload
    const { data: existing, error: fetchError } = await (supabase
      .from("content_items") as any)
      .select("metadata")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("[updateContentDraft] fetch error:", fetchError);
      return { error: fetchError.message };
    }

    const existingMeta =
      typeof existing?.metadata === "object" && existing.metadata !== null
        ? existing.metadata
        : {};

    // Keep original_source_payload untouched if it already exists
    const mergedMetadata = {
      ...existingMeta,
      ...(typeof changes.metadata === "object" && changes.metadata !== null
        ? changes.metadata
        : {}),
      original_source_payload:
        existingMeta.original_source_payload ?? existingMeta,
      last_edited: now,
      edited_by_admin: true,
    };

    const { error: updateError } = await (supabase
      .from("content_items") as any)
      .update({
        ...changes,
        metadata: mergedMetadata,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[updateContentDraft] update error:", updateError);
      return { error: updateError.message };
    }

    revalidatePath("/admin/review");

    console.log(`[updateContentDraft] Content ${id} draft updated by admin.`);
    return { success: true };
  } catch (err: any) {
    console.error("[updateContentDraft] unhandled exception:", err);
    return { error: err.message || "Failed to update draft" };
  }
}

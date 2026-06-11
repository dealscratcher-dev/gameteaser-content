"use server";

import { createAdminSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { Database } from "../../../../../packages/db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const getAdminClient = () => createAdminSupabaseClient() as unknown as SupabaseClient<Database>;

/**
 * Approves a content draft by moving its status to published.
 * Bypasses RLS using the admin client.
 */
export async function approveContent(id: string) {
  // TODO: Add admin authentication check once authentication is integrated.
  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();
    
    // 1. Update status to published
    const { error: updateError } = await (supabase
      .from("content_items") as any)
      .update({
        status: "published",
        published_at: now,
        updated_at: now,
      })
      .eq("id", id);
      
    if (updateError) {
      console.error("[approveContent] update error:", updateError);
      return { error: updateError.message };
    }

    // 2. Insert content_reviews row
    const { error: reviewError } = await (supabase
      .from("content_reviews") as any)
      .insert({
        content_id: id,
        review_status: "approved",
      });

    if (reviewError) {
      console.error("[approveContent] review insert error:", reviewError);
      return { error: reviewError.message };
    }

    // Revalidate relevant pages
    revalidatePath("/admin/review");
    revalidatePath("/");
    
    return { success: true };
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
    
    // 1. Update status to rejected
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

    // 2. Insert content_reviews row
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

    // Revalidate relevant pages
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
    
    // 1. Update status to draft and add review_notes
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

    // 2. Insert content_reviews row
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

    // Revalidate relevant pages
    revalidatePath("/admin/review");
    
    return { success: true };
  } catch (err: any) {
    console.error("[needsChangesContent] unhandled exception:", err);
    return { error: err.message || "Failed to request changes" };
  }
}

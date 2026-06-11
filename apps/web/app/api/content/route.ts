import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Public GET API for published content items.
 * Allows filtering by type (e.g. 'release') and limit (up to 50).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const limitParam = searchParams.get("limit");

    // Parse and validate limit param
    let limit = 20;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 50);
      } else {
        return NextResponse.json(
          { error: "Invalid limit parameter. Must be a positive integer." },
          { status: 400 }
        );
      }
    }

    const supabase = await createServerSupabaseClient();

    // Query published items. Ordered by release date descending matching index:
    // (status, release_date desc nulls last)
    let queryBuilder = supabase
      .from("content_items")
      .select("*")
      .eq("status", "published")
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (type) {
      queryBuilder = queryBuilder.eq("type", type);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("[GET /api/content] Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve content items" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error("[GET /api/content] Unhandled exception:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

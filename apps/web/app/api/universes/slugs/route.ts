import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("universes").select("slug") as {
      data: { slug: string }[] | null;
      error: { message: string } | null;
    };

    if (error) throw error;

    return NextResponse.json({ slugs: (data ?? []).map((r) => r.slug) });
  } catch (err) {
    console.error("[GET /api/universes/slugs]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

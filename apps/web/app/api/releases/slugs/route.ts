import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";  

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("releases").select("id") as {
      data: { id: string }[] | null;
      error: { message: string } | null;
    };

    if (error) throw error;

    return NextResponse.json({ slugs: (data ?? []).map((r) => r.id) });
  } catch (err) {
    console.error("[GET /api/releases/slugs]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
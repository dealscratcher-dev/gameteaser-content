import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { universesRepo } from "@/lib/repositories/universes.repo";
import { mapReleaseRow } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  try {
    const universeSlug = request.nextUrl.searchParams.get("universe");
    const supabase = await createServerSupabaseClient();

    if (universeSlug) {
      const universe = await universesRepo.bySlug(universeSlug);
      if (!universe) {
        return NextResponse.json({ error: "Universe not found" }, { status: 404 });
      }

      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .eq("universe_id", universe.id)
        .order("release_date", { ascending: false }) as {
          data: import("@/types").ReleaseRow[] | null;
          error: { message: string } | null;
        };

      if (error) throw error;

      return NextResponse.json(
        (data ?? []).map((row) =>
          mapReleaseRow({
            ...row,
            universe_slug: universe.slug,
            universe_name: universe.name,
          })
        )
      );
    }

    const { data, error } = await supabase
      .from("releases")
      .select("*, universes(slug, name)")
      .order("release_date", { ascending: false })
      .limit(50) as {
        data: (import("@/types").ReleaseRow & {
          universes: { slug: string; name: string } | null;
        })[] | null;
        error: { message: string } | null;
      };

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((row) => {
        const { universes: universe, ...releaseRow } = row;
        return mapReleaseRow({
          ...releaseRow,
          universe_slug: universe?.slug,
          universe_name: universe?.name,
        });
      })
    );
  } catch (err) {
    console.error("[GET /api/releases]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

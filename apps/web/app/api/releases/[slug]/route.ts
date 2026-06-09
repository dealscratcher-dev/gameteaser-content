import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { mapReleaseRow } from "@/lib/mappers";
import { get, set } from "@/lib/redis";

const CACHE_TTL_SECONDS = 900;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;

  try {
    const cacheKey = `api:release:${slug}`;
    const cached = await get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from("releases")
      .select("*, universes(slug, name)")
      .eq("id", slug)
      .single() as {
        data: (import("@/types").ReleaseRow & {
          universes: { slug: string; name: string } | null;
        }) | null;
        error: { message: string } | null;
      };

    if (error || !row) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }

    const { universes: universe, ...releaseRow } = row;
    const release = mapReleaseRow({
      ...releaseRow,
      universe_slug: universe?.slug,
      universe_name: universe?.name,
    });

    await set(cacheKey, release, CACHE_TTL_SECONDS);

    return NextResponse.json(release, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error(`[GET /api/releases/${slug}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

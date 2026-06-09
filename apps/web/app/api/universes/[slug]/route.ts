import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { universesRepo } from "@/lib/repositories/universes.repo";
import { mapUniverseRow } from "@/lib/mappers";
import { get, set } from "@/lib/redis";

const CACHE_TTL_SECONDS = 3600;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;

  try {
    const cacheKey = `api:universe:${slug}`;
    const cached = await get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT", "Cache-Control": `s-maxage=${CACHE_TTL_SECONDS}` },
      });
    }

    const row = await universesRepo.bySlug(slug);
    if (!row) {
      return NextResponse.json({ error: "Universe not found" }, { status: 404 });
    }

    const universe = mapUniverseRow(row);
    await set(cacheKey, universe, CACHE_TTL_SECONDS);

    return NextResponse.json(universe, {
      headers: { "X-Cache": "MISS", "Cache-Control": `s-maxage=${CACHE_TTL_SECONDS}` },
    });
  } catch (err) {
    console.error(`[GET /api/universes/${slug}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

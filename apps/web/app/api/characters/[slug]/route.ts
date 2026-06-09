import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { charactersRepo } from "@/lib/repositories/characters.repo";
import { mapCharacterRow } from "@/lib/mappers";
import { get, set } from "@/lib/redis";

const CACHE_TTL_SECONDS = 1800;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;

  try {
    const cacheKey = `api:character:${slug}`;
    const cached = await get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const row = await charactersRepo.bySlug(slug);
    if (!row) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const character = mapCharacterRow(row);
    await set(cacheKey, character, CACHE_TTL_SECONDS);

    return NextResponse.json(character, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error(`[GET /api/characters/${slug}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

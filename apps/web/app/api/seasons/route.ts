import { NextRequest, NextResponse } from "next/server";
import { SEASON_EVENTS, getEventsByPanel } from "@/lib/seasons/content";
import { get, set } from "@/lib/redis";

const CACHE_TTL = 300;

export async function GET(request: NextRequest) {
  try {
    const panel = request.nextUrl.searchParams.get("panel");
    const cacheKey = panel ? `seasons:${panel}` : "seasons:all";

    const cached = await get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached }, { headers: { "X-Cache": "HIT" } });
    }

    let data;
    if (panel === "codm" || panel === "pubg") {
      data = getEventsByPanel(panel);
    } else {
      data = SEASON_EVENTS;
    }

    await set(cacheKey, data, CACHE_TTL);

    return NextResponse.json({ data }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error("[GET /api/seasons]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

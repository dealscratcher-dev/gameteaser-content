import { NextRequest, NextResponse } from "next/server";
import { universesRepo } from "@/lib/repositories/universes.repo";
import { mapUniverseCard } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    const rows = await universesRepo.list({ limit: pageSize, offset });
    const data = rows.map(mapUniverseCard);

    return NextResponse.json({
      data,
      total: data.length,
      limit: pageSize,
      offset,
      hasMore: data.length === pageSize,
    });
  } catch (err) {
    console.error("[GET /api/universes]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

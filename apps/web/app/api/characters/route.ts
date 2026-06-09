import { NextRequest, NextResponse } from "next/server";
import { charactersRepo } from "@/lib/repositories/characters.repo";
import { universesRepo } from "@/lib/repositories/universes.repo";
import { mapCharacterRow } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  try {
    const universeSlug = request.nextUrl.searchParams.get("universe");

    if (universeSlug) {
      const universe = await universesRepo.bySlug(universeSlug);
      if (!universe) {
        return NextResponse.json({ error: "Universe not found" }, { status: 404 });
      }
      const rows = await charactersRepo.list({ universeId: universe.id, limit: 50 });
      return NextResponse.json(rows.map(mapCharacterRow));
    }

    const rows = await charactersRepo.list({ limit: 50 });
    return NextResponse.json(rows.map(mapCharacterRow));
  } catch (err) {
    console.error("[GET /api/characters]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

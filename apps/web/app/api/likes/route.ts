import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { charactersRepo } from "@/lib/repositories/characters.repo";
import { get, set, invalidate } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const characterId = request.nextUrl.searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const cacheKey = `likes:${characterId}`;
    const cached = await get<{ count: number; isLiked: boolean }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = createRouteHandlerClient({ cookies });
    const { data: character } = await supabase
      .from("characters")
      .select("like_count")
      .eq("id", characterId)
      .single();

    const { data: { user } } = await supabase.auth.getUser();
    let isLiked = false;
    if (user) {
      isLiked = await charactersRepo.isLiked(user.id, characterId);
    }

    const result = { count: character?.like_count ?? 0, isLiked };
    await set(cacheKey, result, 60);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/likes]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { characterId, action } = await request.json();
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    if (action === "unlike") {
      await charactersRepo.unlike(user.id, characterId);
    } else {
      await charactersRepo.like(user.id, characterId);
    }

    await invalidate(`likes:${characterId}`);

    const { data: character } = await supabase
      .from("characters")
      .select("like_count")
      .eq("id", characterId)
      .single();

    return NextResponse.json({
      success: true,
      count: character?.like_count ?? 0,
      isLiked: action !== "unlike",
    });
  } catch (err) {
    console.error("[POST /api/likes]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

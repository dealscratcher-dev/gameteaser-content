import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { get, set } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `streak:${user.id}`;
    const cached = await get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    const { data, error } = await supabase.rpc("update_streak", {
      p_user_id: user.id,
    });

    if (error) throw error;

    await set(cacheKey, data, 300);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/streaks]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

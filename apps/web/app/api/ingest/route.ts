import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

function checksum(payload: any) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function imageUrl(url: string | undefined) {
  if (!url) return null;
  const absolute = url.startsWith("//") ? `https:${url}` : url;
  return absolute.replace("/t_thumb/", "/t_cover_big/");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

async function getTwitchAccessToken(clientId: string, clientSecret: string) {
  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Twitch auth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function igdbQuery(endpoint: string, body: string, clientId: string, token: string) {
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`IGDB ${endpoint} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function normalizeReleaseDate(item: any) {
  const game = item.game ?? {};
  const releaseDate = item.date ? new Date(item.date * 1000).toISOString().slice(0, 10) : null;
  const sourceId = `${game.id}:${item.date ?? "tbd"}:${item.platform?.id ?? "unknown"}`;
  const platforms = item.platform?.name ? [item.platform.name] : game.platforms?.map((p: any) => p.name).filter(Boolean) ?? [];
  const genres = game.genres?.map((genre: any) => genre.name).filter(Boolean) ?? [];
  const tags = [
    "igdb",
    "game-release",
    ...genres.map((genre: string) => genre.toLowerCase()),
    ...platforms.map((platform: string) => platform.toLowerCase()),
  ];

  return {
    source: "igdb",
    source_id: sourceId,
    type: "release",
    status: "draft",
    title: game.name,
    slug: `${slugify(game.name ?? "igdb-release")}-${item.date ?? "tbd"}-${item.platform?.id ?? "all"}`,
    summary: game.summary ?? null,
    cover_url: imageUrl(game.cover?.url),
    release_date: releaseDate,
    platforms,
    genres,
    tags: [...new Set(tags)],
    external_url: game.url ?? null,
    quality_score: game.total_rating ? Math.min(Number(game.total_rating) / 100, 1) : null,
    source_payload: item,
  };
}

/**
 * Secure HTTP POST endpoint triggered by scheduled database crons (pg_cron).
 * Expects custom header X-Cron-Secret to match env.CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify cron secret key
    const clientSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("[POST /api/ingest] CRON_SECRET is not configured in env.");
      return NextResponse.json(
        { error: "Internal Server Configuration Error" },
        { status: 500 }
      );
    }

    if (clientSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate Twitch API variables
    const twitchClientId = process.env.TWITCH_CLIENT_ID;
    const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!twitchClientId || !twitchClientSecret) {
      console.error("[POST /api/ingest] Twitch credentials are not configured in env.");
      return NextResponse.json(
        { error: "Twitch API Configuration Error" },
        { status: 500 }
      );
    }

    // 3. Set queries parameters (default limit 25, 120 days ahead)
    const limit = 25;
    const start = Math.floor(Date.now() / 1000);
    const end = start + (120 * 86400);

    // 4. Connect to Twitch & query IGDB
    const token = await getTwitchAccessToken(twitchClientId, twitchClientSecret);
    const queryStr = `
      fields
        date,
        human,
        region,
        platform.id,
        platform.name,
        game.id,
        game.name,
        game.slug,
        game.summary,
        game.url,
        game.total_rating,
        game.cover.url,
        game.genres.name,
        game.platforms.name;
      where date >= ${start}
        & date <= ${end}
        & game != null
        & game.version_parent = null;
      sort date asc;
      limit ${limit};
    `;

    const releases = await igdbQuery("release_dates", queryStr, twitchClientId, token);
    const normalized = releases
      .filter((item: any) => item.game?.id && item.game?.name)
      .map(normalizeReleaseDate);

    console.log(`[Cron Ingest] Fetched ${releases.length} items; ${normalized.length} drafts.`);

    const supabase = createAdminSupabaseClient();

    // 5. Save raw imports
    const rawRows = releases.map((payload: any) => ({
      source: "igdb",
      source_id: String(payload.id),
      source_endpoint: "release_dates",
      payload,
      payload_checksum: checksum(payload),
    }));

    if (rawRows.length > 0) {
      const { error: rawError } = await (supabase
        .from("raw_imports") as any)
        .upsert(rawRows, { onConflict: "source,source_id,source_endpoint" });
      if (rawError) throw new Error(`raw_imports upsert failed: ${rawError.message}`);
    }

    // 6. Save normalized drafts
    if (normalized.length > 0) {
      const { error: contentError } = await (supabase
        .from("content_items") as any)
        .upsert(normalized, { onConflict: "source,source_id,type" });
      if (contentError) throw new Error(`content_items upsert failed: ${contentError.message}`);
    }

    return NextResponse.json({
      success: true,
      raw_imported: rawRows.length,
      drafts_stored: normalized.length,
    });

  } catch (err: any) {
    console.error("[POST /api/ingest] Cron execution failed:", err);
    return NextResponse.json(
      { error: err.message || "Ingestion failed" },
      { status: 500 }
    );
  }
}

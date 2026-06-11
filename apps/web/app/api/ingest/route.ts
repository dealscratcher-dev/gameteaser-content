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
    // ──────────────────────────────────────────────────────────────
    // 1. LOG REQUEST METADATA
    // ──────────────────────────────────────────────────────────────
    console.log("[POST /api/ingest] Request received");
    console.log(`[POST /api/ingest] Method: ${request.method}`);
    
    // ──────────────────────────────────────────────────────────────
    // 2. VERIFY CRON SECRET
    // ──────────────────────────────────────────────────────────────
    const clientSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    console.log(`[POST /api/ingest] CRON_SECRET env var: ${expectedSecret ? "✓ set" : "✗ missing"}`);

    if (!expectedSecret) {
      console.error("[POST /api/ingest] ✗ CRON_SECRET is not configured in env.");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (clientSecret !== expectedSecret) {
      console.warn("[POST /api/ingest] ✗ X-Cron-Secret header mismatch (unauthorized)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[POST /api/ingest] ✓ X-Cron-Secret verified");

    // ──────────────────────────────────────────────────────────────
    // 3. VALIDATE TWITCH API VARIABLES
    // ──────────────────────────────────────────────────────────────
    const twitchClientId = process.env.TWITCH_CLIENT_ID;
    const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

    console.log(`[POST /api/ingest] TWITCH_CLIENT_ID env var: ${twitchClientId ? "✓ set" : "✗ missing"}`);
    console.log(`[POST /api/ingest] TWITCH_CLIENT_SECRET env var: ${twitchClientSecret ? "✓ set" : "✗ missing"}`);

    if (!twitchClientId || !twitchClientSecret) {
      console.error("[POST /api/ingest] ✗ Twitch credentials missing from env.");
      return NextResponse.json(
        { error: "Twitch credentials not configured" },
        { status: 500 }
      );
    }

    // ──────────────────────────────────────────────────────────────
    // 4. VALIDATE SUPABASE VARIABLES
    // ──────────────────────────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`[POST /api/ingest] NEXT_PUBLIC_SUPABASE_URL env var: ${supabaseUrl ? "✓ set" : "✗ missing"}`);
    console.log(`[POST /api/ingest] SUPABASE_SERVICE_ROLE_KEY env var: ${supabaseServiceKey ? "✓ set" : "✗ missing"}`);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[POST /api/ingest] ✗ Supabase credentials missing from env.");
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      );
    }

    // ──────────────────────────────────────────────────────────────
    // 5. FETCH TWITCH TOKEN
    // ──────────────────────────────────────────────────────────────
    console.log("[POST /api/ingest] Fetching Twitch access token...");
    const token = await getTwitchAccessToken(twitchClientId, twitchClientSecret);
    console.log("[POST /api/ingest] ✓ Twitch auth successful");

    // ──────────────────────────────────────────────────────────────
    // 6. QUERY IGDB
    // ──────────────────────────────────────────────────────────────
    const limit = 25;
    const start = Math.floor(Date.now() / 1000);
    const end = start + (120 * 86400);

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

    console.log("[POST /api/ingest] Querying IGDB release_dates...");
    const releases = await igdbQuery("release_dates", queryStr, twitchClientId, token);
    console.log(`[POST /api/ingest] ✓ IGDB returned ${releases.length} items`);

    if (releases.length === 0) {
      console.warn("[POST /api/ingest] ⚠ IGDB returned 0 items");
    }

    // ──────────────────────────────────────────────────────────────
    // 7. NORMALIZE RECORDS
    // ──────────────────────────────────────────────────────────────
    const normalized = releases
      .filter((item: any) => item.game?.id && item.game?.name)
      .map(normalizeReleaseDate);

    console.log(`[POST /api/ingest] ✓ Normalized ${normalized.length} items for content_items`);

    // ──────────────────────────────────────────────────────────────
    // 8. CREATE ADMIN SUPABASE CLIENT
    // ──────────────────────────────────────────────────────────────
    console.log("[POST /api/ingest] Creating admin Supabase client...");
    const supabase = createAdminSupabaseClient();
    console.log("[POST /api/ingest] ✓ Admin client created");

    // ──────────────────────────────────────────────────────────────
    // 9. UPSERT RAW IMPORTS
    // ──────────────────────────────────────────────────────────────
    const rawRows = releases.map((payload: any) => ({
      source: "igdb",
      source_id: String(payload.id),
      source_endpoint: "release_dates",
      payload,
      payload_checksum: checksum(payload),
    }));

    let rawImportedCount = 0;
    if (rawRows.length > 0) {
      console.log(`[POST /api/ingest] Upserting ${rawRows.length} rows into raw_imports...`);
      const { error: rawError, data: rawData } = await (supabase
        .from("raw_imports") as any)
        .upsert(rawRows, { onConflict: "source,source_id,source_endpoint" });

      if (rawError) {
        console.error(`[POST /api/ingest] ✗ raw_imports upsert error: ${rawError.message}`);
        throw new Error(`raw_imports upsert failed: ${rawError.message}`);
      }

      rawImportedCount = rawRows.length;
      console.log(`[POST /api/ingest] ✓ raw_imports upsert successful (${rawImportedCount} rows)`);
    } else {
      console.warn("[POST /api/ingest] ⚠ No raw rows to upsert (releases.length === 0)");
    }

    // ──────────────────────────────────────────────────────────────
    // 10. UPSERT NORMALIZED DRAFTS
    // ──────────────────────────────────────────────────────────────
    let draftStoredCount = 0;
    if (normalized.length > 0) {
      console.log(`[POST /api/ingest] Upserting ${normalized.length} rows into content_items...`);
      const { error: contentError, data: contentData } = await (supabase
        .from("content_items") as any)
        .upsert(normalized, { onConflict: "source,source_id,type" });

      if (contentError) {
        console.error(`[POST /api/ingest] ✗ content_items upsert error: ${contentError.message}`);
        throw new Error(`content_items upsert failed: ${contentError.message}`);
      }

      draftStoredCount = normalized.length;
      console.log(`[POST /api/ingest] ✓ content_items upsert successful (${draftStoredCount} rows)`);
    } else {
      console.warn("[POST /api/ingest] ⚠ No normalized rows to upsert (normalized.length === 0)");
    }

    // ──────────────────────────────────────────────────────────────
    // 11. RETURN SUCCESS
    // ──────────────────────────────────────────────────────────────
    console.log(`[POST /api/ingest] ✓ Cron execution complete: ${rawImportedCount} raw, ${draftStoredCount} drafts`);

    return NextResponse.json({
      success: true,
      raw_imported: rawImportedCount,
      drafts_stored: draftStoredCount,
      timestamp: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("[POST /api/ingest] ✗ Cron execution failed:", err.message);
    return NextResponse.json(
      { 
        error: err.message || "Ingestion failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
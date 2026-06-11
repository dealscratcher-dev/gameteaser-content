#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const APP_ENV_PATH = resolve(process.cwd(), ".env.local");
const ROOT_ENV_PATH = resolve(process.cwd(), "../../.env.local");

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      if (!key || process.env[key] != null) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // Optional local file.
  }
}

loadEnvFile(ROOT_ENV_PATH);
loadEnvFile(APP_ENV_PATH);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const config = {
  supabaseUrl: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  twitchClientId: requiredEnv("TWITCH_CLIENT_ID"),
  twitchClientSecret: requiredEnv("TWITCH_CLIENT_SECRET"),
};

const args = new Map(
  process.argv.slice(2).map((arg, index, all) => {
    if (!arg.startsWith("--")) return [arg, true];
    const next = all[index + 1];
    return [arg, next && !next.startsWith("--") ? next : true];
  })
);

const limit = Math.min(Number(args.get("--limit") ?? 25), 100);
const daysAhead = Number(args.get("--days-ahead") ?? 120);
const dryRun = args.has("--dry-run");

function nowUnixSeconds() {
  return Math.floor(Date.now() / 1000);
}

function addDaysUnixSeconds(days) {
  return Math.floor((Date.now() + days * 86_400_000) / 1000);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function checksum(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function imageUrl(url) {
  if (!url) return null;
  const absolute = url.startsWith("//") ? `https:${url}` : url;
  return absolute.replace("/t_thumb/", "/t_cover_big/");
}

async function getTwitchAccessToken() {
  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", config.twitchClientId);
  url.searchParams.set("client_secret", config.twitchClientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Twitch auth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.access_token) throw new Error("Twitch auth did not return an access token");
  return data.access_token;
}

async function igdbQuery(endpoint, body, token) {
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Client-ID": config.twitchClientId,
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

function normalizeReleaseDate(item) {
  const game = item.game ?? {};
  const releaseDate = item.date ? new Date(item.date * 1000).toISOString().slice(0, 10) : null;
  const sourceId = `${game.id}:${item.date ?? "tbd"}:${item.platform?.id ?? "unknown"}`;
  const platforms = item.platform?.name ? [item.platform.name] : game.platforms?.map((p) => p.name).filter(Boolean) ?? [];
  const genres = game.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
  const tags = [
    "igdb",
    "game-release",
    ...genres.map((genre) => genre.toLowerCase()),
    ...platforms.map((platform) => platform.toLowerCase()),
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

async function main() {
  const token = await getTwitchAccessToken();
  const start = nowUnixSeconds();
  const end = addDaysUnixSeconds(daysAhead);

  const query = `
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

  const releases = await igdbQuery("release_dates", query, token);
  const normalized = releases
    .filter((item) => item.game?.id && item.game?.name)
    .map(normalizeReleaseDate);

  console.log(`Fetched ${releases.length} IGDB release rows; ${normalized.length} usable drafts.`);

  if (dryRun) {
    console.log(JSON.stringify(normalized.slice(0, 5), null, 2));
    return;
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rawRows = releases.map((payload) => ({
    source: "igdb",
    source_id: String(payload.id),
    source_endpoint: "release_dates",
    payload,
    payload_checksum: checksum(payload),
  }));

  if (rawRows.length) {
    const { error } = await supabase
      .from("raw_imports")
      .upsert(rawRows, { onConflict: "source,source_id,source_endpoint" });
    if (error) throw new Error(`raw_imports upsert failed: ${error.message}`);
  }

  if (normalized.length) {
    const { error } = await supabase
      .from("content_items")
      .upsert(normalized, { onConflict: "source,source_id,type" });
    if (error) throw new Error(`content_items upsert failed: ${error.message}`);
  }

  console.log(`Stored ${rawRows.length} raw imports and ${normalized.length} draft content items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

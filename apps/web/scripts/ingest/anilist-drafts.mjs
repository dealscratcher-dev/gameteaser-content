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
};

const args = new Map(
  process.argv.slice(2).map((arg, index, all) => {
    if (!arg.startsWith("--")) return [arg, true];
    const next = all[index + 1];
    return [arg, next && !next.startsWith("--") ? next : true];
  })
);

const limit = Math.min(Number(args.get("--limit") ?? 25), 100);
const dryRun = args.has("--dry-run");

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

function mapGenre(anilistGenre) {
  const genreMap = {
    'Action': 'action',
    'Adventure': 'adventure',
    'Comedy': 'comedy',
    'Drama': 'drama',
    'Fantasy': 'fantasy',
    'Horror': 'horror',
    'Mystery': 'mystery',
    'Romance': 'romance',
    'Sci-Fi': 'sci_fi',
    'Slice of Life': 'slice_of_life',
    'Sports': 'sports',
    'Supernatural': 'supernatural',
    'Thriller': 'thriller'
  };
  return genreMap[anilistGenre] || 'other';
}

function normalizeAnime(item) {
  const title = item.title.english || item.title.romaji || item.title.native;
  
  let releaseDate = null;
  if (item.startDate?.year) {
    const y = item.startDate.year;
    const m = String(item.startDate.month || 1).padStart(2, "0");
    const d = String(item.startDate.day || 1).padStart(2, "0");
    releaseDate = `${y}-${m}-${d}`;
  }

  const slug = `${slugify(title || "anilist-release")}-${item.id}`;
  const summary = item.description ? item.description.replace(/<[^>]*>/g, "") : null;
  
  const genres = item.genres?.map(g => mapGenre(g)) || [];
  const platforms = item.format ? [item.format] : [];
  
  const tags = [
    "anilist",
    "anime-release",
    ...genres,
    ...platforms.map(p => p.toLowerCase())
  ];

  return {
    source: "anilist",
    source_id: String(item.id),
    type: "anime",
    status: "draft",
    title,
    slug,
    summary,
    cover_url: item.coverImage?.extraLarge || item.coverImage?.large || null,
    release_date: releaseDate,
    platforms,
    genres,
    tags: [...new Set(tags)],
    external_url: item.siteUrl || null,
    quality_score: item.averageScore ? Math.min(Number(item.averageScore) / 100, 1) : null,
    source_payload: item,
    featured: false,
    metadata: {
      format: item.format,
      status: item.status,
      episodes: item.episodes,
      isAdult: item.isAdult,
      banner_image: item.bannerImage,
      mal_id: item.idMal,
      section_route: "upcoming-drops",
    }
  };
}

async function fetchAniListUpcoming(limitCount) {
  const apiUrl = "https://graphql.anilist.co";
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          synonyms
          description
          startDate { year month day }
          coverImage { large extraLarge }
          bannerImage
          genres
          tags { name rank }
          averageScore
          popularity
          siteUrl
          format
          status
          episodes
          isAdult
        }
      }
    }
  `;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { page: 1, perPage: limitCount }
    })
  });

  if (!response.ok) {
    throw new Error(`AniList query failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.data?.Page?.media || [];
}

async function main() {
  console.log(`Querying upcoming anime from AniList (limit: ${limit})...`);
  const mediaList = await fetchAniListUpcoming(limit);
  const normalized = mediaList.map(normalizeAnime);

  console.log(`Fetched ${mediaList.length} AniList upcoming media items; normalized ${normalized.length} drafts.`);

  if (dryRun) {
    console.log(JSON.stringify(normalized.slice(0, 3), null, 2));
    return;
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rawRows = mediaList.map((payload) => ({
    source: "anilist",
    source_id: String(payload.id),
    source_endpoint: "graphql:media",
    payload,
    payload_checksum: checksum(payload),
  }));

  if (rawRows.length) {
    console.log(`Upserting ${rawRows.length} raw imports...`);
    const { error } = await supabase
      .from("raw_imports")
      .upsert(rawRows, { onConflict: "source,source_id,source_endpoint" });
    if (error) throw new Error(`raw_imports upsert failed: ${error.message}`);
  }

  if (normalized.length) {
    console.log(`Upserting ${normalized.length} content item drafts...`);
    const { error } = await supabase
      .from("content_items")
      .upsert(normalized, { onConflict: "source,source_id,type" });
    if (error) throw new Error(`content_items upsert failed: ${error.message}`);
  }

  console.log(`Stored ${rawRows.length} AniList raw imports and ${normalized.length} draft content items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

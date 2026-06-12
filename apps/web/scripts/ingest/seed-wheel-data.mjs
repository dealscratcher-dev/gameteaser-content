#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const APP_ENV_PATH = resolve(process.cwd(), "apps/web/.env.local");
const ROOT_ENV_PATH = resolve(process.cwd(), ".env.local");

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
  } catch (err) {
    // ignore
  }
}

loadEnvFile(ROOT_ENV_PATH);
loadEnvFile(APP_ENV_PATH);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ghrnooiajxutntldybrb.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const now = Date.now();
const releases = [
  // ─── Black Ops Series ───
  {
    title: "Call of Duty: Black Ops Cold War",
    slug: "cod-black-ops-cold-war",
    tags: ["wheel-release", "black-ops-series"],
    release_date: "2020-11-13",
    metadata: {
      short_code: "CW",
      wheel_status: "past",
      release_label: "Released Nov 13, 2020",
    }
  },
  {
    title: "Call of Duty: Black Ops 6",
    slug: "cod-black-ops-6",
    tags: ["wheel-release", "black-ops-series"],
    release_date: "2024-10-25",
    metadata: {
      short_code: "BO6",
      wheel_status: "current",
      release_label: "Current Release",
      target_date: new Date(now + (11 * 86400 + 21 * 3600 + 27 * 60 + 8) * 1000).toISOString()
    }
  },
  {
    title: "Call of Duty: Black Ops 7",
    slug: "cod-black-ops-7",
    tags: ["wheel-release", "black-ops-series"],
    release_date: "2025-10-24",
    metadata: {
      short_code: "BO7",
      wheel_status: "upcoming",
      release_label: "Coming 2025",
      target_date: "2025-10-24T00:00:00Z"
    }
  },

  // ─── Modern Warfare Series ───
  {
    title: "Call of Duty: Modern Warfare",
    slug: "cod-modern-warfare",
    tags: ["wheel-release", "modern-warfare-series"],
    release_date: "2019-10-25",
    metadata: {
      short_code: "MW",
      wheel_status: "past",
      release_label: "Released Oct 25, 2019",
    }
  },
  {
    title: "Call of Duty: Modern Warfare II",
    slug: "cod-modern-warfare-ii",
    tags: ["wheel-release", "modern-warfare-series"],
    release_date: "2022-10-28",
    metadata: {
      short_code: "MW2",
      wheel_status: "past",
      release_label: "Released Oct 28, 2022",
    }
  },
  {
    title: "Call of Duty: Modern Warfare III",
    slug: "cod-modern-warfare-iii",
    tags: ["wheel-release", "modern-warfare-series"],
    release_date: "2023-11-10",
    metadata: {
      short_code: "MW3",
      wheel_status: "current",
      release_label: "Current Season",
      target_date: new Date(now + (18 * 86400 + 6 * 3600) * 1000).toISOString()
    }
  },

  // ─── Warzone Series ───
  {
    title: "Warzone — Season 2",
    slug: "warzone-season-2",
    tags: ["wheel-release", "warzone-series"],
    release_date: "2024-02-07",
    metadata: {
      short_code: "S2",
      wheel_status: "past",
      release_label: "Released Feb 2024",
    }
  },
  {
    title: "Warzone — Season 3",
    slug: "warzone-season-3",
    tags: ["wheel-release", "warzone-series"],
    release_date: "2024-04-03",
    metadata: {
      short_code: "S3",
      wheel_status: "past",
      release_label: "Released Apr 2024",
    }
  },
  {
    title: "Warzone — Season 4",
    slug: "warzone-season-4",
    tags: ["wheel-release", "warzone-series"],
    release_date: "2024-05-29",
    metadata: {
      short_code: "S4",
      wheel_status: "current",
      release_label: "Active Now",
      target_date: new Date(now + (24 * 86400 + 14 * 3600) * 1000).toISOString()
    }
  },
  {
    title: "Warzone — Season 5",
    slug: "warzone-season-5",
    tags: ["wheel-release", "warzone-series"],
    release_date: "2024-07-24",
    metadata: {
      short_code: "S5",
      wheel_status: "upcoming",
      release_label: "Coming Soon",
      target_date: new Date(now + (55 * 86400) * 1000).toISOString()
    }
  },

  // ─── PUBG Series ───
  {
    title: "PUBG — Season 29",
    slug: "pubg-season-29",
    tags: ["wheel-release", "pubg-series"],
    release_date: "2024-01-10",
    metadata: {
      short_code: "S29",
      wheel_status: "past",
      release_label: "Released Jan 2024",
    }
  },
  {
    title: "PUBG — Season 30",
    slug: "pubg-season-30",
    tags: ["wheel-release", "pubg-series"],
    release_date: "2024-03-06",
    metadata: {
      short_code: "S30",
      wheel_status: "current",
      release_label: "Active Now",
      target_date: new Date(now + (8 * 86400 + 10 * 3600) * 1000).toISOString()
    }
  },
  {
    title: "PUBG — Season 31",
    slug: "pubg-season-31",
    tags: ["wheel-release", "pubg-series"],
    release_date: "2024-05-08",
    metadata: {
      short_code: "S31",
      wheel_status: "upcoming",
      release_label: "Coming Soon",
      target_date: new Date(now + (42 * 86400) * 1000).toISOString()
    }
  }
];

async function seed() {
  const rows = releases.map((r, i) => ({
    source: "seed",
    source_id: `wheel-${i}`,
    type: "release",
    status: "published",
    title: r.title,
    slug: r.slug,
    release_date: r.release_date,
    tags: r.tags,
    metadata: r.metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  console.log(`Seeding ${rows.length} release wheel items...`);

  const { error } = await supabase
    .from("content_items")
    .upsert(rows, { onConflict: "source,source_id,type" });

  if (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  console.log("✓ Seeding completed successfully!");
}

seed();

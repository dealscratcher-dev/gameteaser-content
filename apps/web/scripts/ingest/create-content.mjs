#!/usr/bin/env node

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

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith("--")) {
    const next = process.argv[i + 1];
    if (next && !next.startsWith("--")) {
      args.set(arg, next);
      i++;
    } else {
      args.set(arg, true);
    }
  }
}

const type = args.get("--type");
const title = args.get("--title");
const slug = args.get("--slug");
const summary = args.get("--summary") || args.get("--subtitle");
const coverUrl = args.get("--cover-url") || null;
const status = args.get("--status") || "published";

if (!type || !["event", "article"].includes(type)) {
  console.error("Error: --type must be either 'event' or 'article'");
  process.exit(1);
}

if (!title) {
  console.error("Error: --title is required");
  process.exit(1);
}

if (!slug) {
  console.error("Error: --slug is required");
  process.exit(1);
}

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const now = new Date().toISOString();
  let metadata = {
    created_via: "cli",
    created_at: now,
  };
  let platforms = [];
  let genres = [];
  let tags = [];
  let release_date = null;

  if (type === "event") {
    const start = args.get("--start") || now;
    const end = args.get("--end");
    const panelKey = args.get("--panel-key"); // "codm" or "pubg"
    const vertical = args.get("--vertical") || "games";
    const rewardsStr = args.get("--rewards") || "";
    const rewards = rewardsStr ? rewardsStr.split(",").map(r => r.trim()).filter(Boolean) : [];

    if (!end) {
      console.error("Error: --end (end date/time) is required for events");
      process.exit(1);
    }

    metadata = {
      ...metadata,
      vertical,
      start_date: start,
      end_date: end,
      panel_key: panelKey || null,
      rewards,
    };

    release_date = end.split("T")[0]; // YYYY-MM-DD for sorting
    if (panelKey) {
      tags.push(panelKey.toLowerCase());
    }
    tags.push("event");
    tags.push(vertical);
    tags.push(...rewards.map(r => r.toLowerCase()));
  } else if (type === "article") {
    const tagsStr = args.get("--tags") || "";
    tags = tagsStr ? tagsStr.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    tags.push("article");

    metadata = {
      ...metadata,
      body: args.get("--body") || "",
    };
  }

  const row = {
    source: "admin",
    source_id: slug,
    type,
    status,
    title,
    slug,
    summary: summary || null,
    cover_url: coverUrl,
    release_date,
    platforms,
    genres,
    tags: [...new Set(tags)],
    source_payload: { cli_args: Object.fromEntries(args) },
    metadata,
    created_at: now,
    updated_at: now,
    published_at: status === "published" ? now : null,
  };

  console.log(`Upserting ${type} "${title}" (slug: ${slug})...`);

  const { error } = await supabase
    .from("content_items")
    .upsert(row, { onConflict: "source,source_id,type" });

  if (error) {
    throw new Error(`Failed to upsert: ${error.message}`);
  }

  console.log(`✓ Successfully stored and ${status} the ${type} "${title}"!`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

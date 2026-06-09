// apps/web/lib/env.ts
// ─────────────────────────────────────────────────────────────────────────────
// Validates all required env vars at startup.
// Import this ONCE at the top of supabase.ts / redis.ts – never use
// process.env directly anywhere else in the app.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Schema ────────────────────────────────────────────────────────────────────
const envSchema = z.object({
  // Supabase – public (safe to expose to browser)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Supabase – server-only (never sent to browser)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required")
    .optional(), // optional so browser bundle doesn't crash; enforced server-side below

  // Redis
  REDIS_URL: z
    .string()
    .min(1, "REDIS_URL is required")
    .optional(),

  // App
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

// ── Parse ─────────────────────────────────────────────────────────────────────
const _parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY,
  REDIS_URL:                     process.env.REDIS_URL,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV:                      process.env.NODE_ENV,
});

if (!_parsed.success) {
  const issues = _parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `\n\n❌  Environment validation failed:\n${issues}\n\nCheck your .env.local file.\n`
  );
}

export const env = _parsed.data;

// ── Server-side guard ─────────────────────────────────────────────────────────
// Call this at the top of any server-side function that needs the service key.
export function assertServerEnv(): void {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase calls."
    );
  }
}
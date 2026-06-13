// apps/web/lib/supabase.server.ts
// ─────────────────────────────────────────────────────────────────────────────
// SERVER-ONLY — Server Components, Route Handlers, Server Actions.
// Never import this in client code or hooks.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient }                               from "@supabase/supabase-js";
import { cookies }                                    from "next/headers";
import type { Database }                              from "../../../packages/db/database.types";
import { env, assertServerEnv }                       from "./env";

// ── 1. Server client (Server Components / Route Handlers / Server Actions) ────
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return _createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component – cookie writes silently fail.
            // The middleware handles session refresh in that case.
          }
        },
      },
    }
  );
}

// ── Public read client (Server Components / cached public pages) ────────────
export function createPublicSupabaseClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ── 2. Admin client (Server-only – bypasses RLS) ─────────────────────────────
// IMPORTANT: Never expose this to the client bundle.
// Usage: seed scripts, background jobs, admin API routes.
export function createAdminSupabaseClient() {
  assertServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ── Typed query helper ────────────────────────────────────────────────────────
export async function query<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await fn();
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (data === null) throw new Error("Supabase query returned null data");
  return data;
}

// ── Nullable query helper ─────────────────────────────────────────────────────
export async function queryNullable<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T | null> {
  const { data, error } = await fn();
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data;
}

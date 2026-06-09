// apps/web/lib/supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Three clients, each for a different runtime context:
//
//   createServerClient()  – Server Components, Route Handlers, Server Actions
//                           Uses cookies() for session. Reads + writes.
//
//   createBrowserClient() – Client Components ('use client')
//                           Singleton. Manages its own session via localStorage.
//
//   createAdminClient()   – Server-only privileged operations (bypasses RLS).
//                           NEVER import this in client code.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import { createClient }                                from "@supabase/supabase-js";
import { cookies }                                     from "next/headers";
import type { Database }                               from "@db/database.types";
import { env, assertServerEnv }                        from "./env";

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

// ── 2. Browser client (Client Components) ────────────────────────────────────
// Singleton pattern – one instance per browser tab.
let _browserClient: ReturnType<typeof _createBrowserClient<Database>> | null =
  null;

export function createBrowserSupabaseClient() {
  if (_browserClient) return _browserClient;

  _browserClient = _createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return _browserClient;
}

// ── 3. Admin client (Server-only – bypasses RLS) ─────────────────────────────
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
// Wraps a Supabase query and throws on error so callers don't need to check.
export async function query<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await fn();
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (data === null) throw new Error("Supabase query returned null data");
  return data;
}

// ── Nullable query helper ─────────────────────────────────────────────────────
// Same as above but returns null instead of throwing when data is missing.
export async function queryNullable<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T | null> {
  const { data, error } = await fn();
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data;
}
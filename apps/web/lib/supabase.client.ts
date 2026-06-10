// apps/web/lib/supabase.client.ts
// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SAFE — safe to import in "use client" hooks and components.
// Contains zero server-only imports (no next/headers, no cookies).
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import type { Database }                               from "@db/database.types";
import { env }                                         from "./env";

// Singleton pattern – one instance per browser tab.
let _browserClient: ReturnType<typeof _createBrowserClient<Database>> | null = null;

export function createBrowserSupabaseClient() {
  if (_browserClient) return _browserClient;

  _browserClient = _createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return _browserClient;
}

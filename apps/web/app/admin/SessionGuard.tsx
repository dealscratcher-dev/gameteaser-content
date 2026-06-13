// app/admin/SessionGuard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Mounts invisibly on admin pages and keeps the router in sync with Supabase
// auth changes. It must never sign out on tab hide/pagehide: browsers fire
// those events during normal tab switches, reloads, mobile app switches, and
// bfcache restores, which can leave the admin route looking like a cookie bug.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase.client";

export default function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/admin/login");
        router.refresh();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [router]);

  // Renders nothing — purely behavioural.
  return null;
}

import { createAdminSupabaseClient } from "@/lib/supabase";
import ReviewList from "./ReviewList";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const supabase = createAdminSupabaseClient();

  // Fetch draft content items
  const { data: drafts, error } = await supabase
    .from("content_items")
    .select("*")
    .in("status", ["draft", "in_review"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AdminReviewPage] Failed to fetch drafts:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-[family-name:var(--font-ibm-plex)] pb-12">
      {/* Admin Header */}
      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="admin shield">🛡️</span>
            <div>
              <h1 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-3xl">
                Content Curator Dashboard
              </h1>
              <p className="text-xs text-white/55 mt-1">
                Review and publish imported content drafts
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1.5 rounded-full">
            Admin Mode
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="border border-red-500/20 bg-red-500/10 p-5 text-red-200 rounded-lg">
            <h2 className="font-bold mb-1">Database connection failed</h2>
            <p className="text-sm opacity-85">{error.message}</p>
          </div>
        ) : (
          <ReviewList initialDrafts={drafts || []} />
        )}
      </main>
    </div>
  );
}

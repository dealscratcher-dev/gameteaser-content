import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | TheGameBit",
  description: "News, updates, and stories from TheGameBit.",
};

export default async function BlogPage() {
  const supabase = await createServerSupabaseClient();
  let articles: any[] = [];

  try {
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("type", "article")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    
    if (data) {
      articles = data;
    }
  } catch (err) {
    console.error("Failed to load articles:", err);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white mb-8">
        Blog & News
      </h1>
      
      {articles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article: any) => {
            const dateStr = article.published_at
              ? new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(article.published_at))
              : "";

            return (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group relative flex flex-col justify-between overflow-hidden border border-white/10 bg-zinc-900/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 rounded-lg"
              >
                <div>
                  {article.cover_url && (
                    <div className="aspect-video w-full relative bg-zinc-950 rounded overflow-hidden border border-white/5 mb-4 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.cover_url}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <h2 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase leading-tight tracking-tight text-white group-hover:text-orange-400 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-xs text-white/45 mt-1 font-medium">{dateStr}</p>
                  {article.summary && (
                    <p className="text-sm leading-6 text-white/60 mt-3 line-clamp-3">
                      {article.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-5">
                  <div className="flex flex-wrap gap-1">
                    {article.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 group-hover:text-orange-300 transition-colors">
                    Read →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-white/55 font-[family-name:var(--font-ibm-plex)] text-sm">
          No articles or guides have been published yet. Check back later!
        </p>
      )}
    </main>
  );
}

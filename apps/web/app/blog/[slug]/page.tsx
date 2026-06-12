import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data: article } = await (supabase.from("content_items") as any)
      .select("title, summary")
      .eq("type", "article")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!article) return { title: "Article Not Found" };
    return {
      title: article.title,
      description: article.summary,
    };
  } catch {
    return { title: "Article" };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  let article: any = null;

  try {
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("type", "article")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (data) {
      article = data;
    }
  } catch (err) {
    console.error("Failed to load article detail:", err);
  }

  if (!article) notFound();

  const dateStr = article.published_at
    ? new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(article.published_at))
    : "";

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-400">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-white">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-white line-clamp-1">{article.title}</li>
        </ol>
      </nav>

      {article.cover_url && (
        <div className="aspect-video w-full relative bg-zinc-950 rounded-xl overflow-hidden border border-white/10 mb-8 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_url}
            alt={article.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <header className="mb-8 border-b border-white/10 pb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags?.map((tag: string) => (
            <span key={tag} className="text-[10px] font-bold uppercase tracking-[0.12em] bg-orange-500/10 border border-orange-500/25 text-orange-300 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
        <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl sm:text-5xl font-extrabold uppercase leading-tight tracking-tight text-white">
          {article.title}
        </h1>
        {dateStr && (
          <p className="text-sm text-white/45 mt-3">
            Published on <time dateTime={article.published_at}>{dateStr}</time>
          </p>
        )}
      </header>

      <article className="prose prose-invert max-w-none text-zinc-300 font-[family-name:var(--font-ibm-plex)] leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
        {article.metadata?.body || article.summary}
      </article>
    </main>
  );
}

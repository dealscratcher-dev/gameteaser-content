import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CountdownCard from "@/components/countdown/CountdownCard";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getEventById, getPlayersByEvent } from "@/lib/seasons/content";

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  let event: any = null;

  try {
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("type", "event")
      .eq("status", "published")
      .eq("slug", eventId)
      .single();

    if (data) {
      event = {
        title: data.title,
        subtitle: data.summary,
      };
    }
  } catch {}

  if (!event) {
    event = getEventById(eventId);
  }

  if (!event) return { title: "Event Not Found" };

  return {
    title: event.title,
    description: event.subtitle,
    openGraph: {
      images: [`/api/og?title=${encodeURIComponent(event.title)}&subtitle=${encodeURIComponent(event.subtitle)}`],
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  let event: any = null;

  try {
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("type", "event")
      .eq("status", "published")
      .eq("slug", eventId)
      .single();

    if (data) {
      event = {
        id: data.slug,
        vertical: data.metadata?.vertical || data.type || "games",
        title: data.title,
        subtitle: data.summary || "",
        start: data.metadata?.start_date || data.created_at,
        end: data.metadata?.end_date || data.release_date,
        rewards: data.metadata?.rewards || data.tags || [],
        panelKey: data.metadata?.panel_key || null,
        dbId: data.id,
      };
    }
  } catch (err) {
    console.error("Failed to load event details from DB:", err);
  }

  // Fallback to static config
  if (!event) {
    const staticEvent = getEventById(eventId);
    if (!staticEvent) notFound();
    event = staticEvent;
  }

  // Retrieve players for hologram grid. Fallback to matching franchise players if no players found for the db id
  let players = getPlayersByEvent(event.id);
  if (players.length === 0) {
    if (event.panelKey === "codm" || event.id.startsWith("codm")) {
      players = getPlayersByEvent("codm-s5");
    } else if (event.panelKey === "pubg" || event.id.startsWith("pubg")) {
      players = getPlayersByEvent("pubg-a19");
    }
  }

  const badgeVariant = event.panelKey ?? "default";
  const accentVariant = event.panelKey ?? "default";

  // Query related published content items (articles and game releases) from DB matching tags or keywords
  let relatedReleases: any[] = [];
  let relatedArticles: any[] = [];

  try {
    const searchKeys = [
      event.panelKey,
      event.id,
      event.id.replace("-s5", "").replace("-a19", ""), // e.g. "codm", "pubg"
    ].filter(Boolean).map((k: string) => k.toLowerCase());

    if (searchKeys.length > 0) {
      const { data } = await (supabase.from("content_items") as any)
        .select("*")
        .eq("status", "published")
        .neq("slug", event.id); // exclude the event itself

      if (data) {
        const matches = data.filter((item: any) => {
          const itemTags = (item.tags || []).map((t: string) => t.toLowerCase());
          const titleLower = item.title.toLowerCase();
          const summaryLower = (item.summary || "").toLowerCase();
          
          return searchKeys.some(key => 
            itemTags.includes(key) || 
            titleLower.includes(key) || 
            summaryLower.includes(key)
          );
        });

        relatedReleases = matches.filter((item: any) => item.type === "release" || item.type === "game").slice(0, 6);
        relatedArticles = matches.filter((item: any) => item.type === "article").slice(0, 6);
      }
    }
  } catch (err) {
    console.error("Failed to load related content items for event:", err);
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-400">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-white">Home</Link></li>
          <li aria-hidden="true">/</li>
          {event.panelKey && (
            <>
              <li>
                <Link href={`/${event.panelKey}`} className="hover:text-white uppercase">
                  {event.panelKey}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li aria-current="page" className="text-white">{event.title}</li>
        </ol>
      </nav>

      <CountdownCard
        title={event.title}
        subtitle={event.subtitle}
        endDate={event.end}
        startDate={event.start}
        badge={event.vertical}
        badgeVariant={badgeVariant}
        accentVariant={accentVariant}
        showProgress
        progressLabel="Event progress"
        className="mb-10"
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px] items-start mb-12">
        <section>
          <h2 className="mb-4 font-barlow text-2xl font-bold uppercase text-white border-b border-white/5 pb-2">
            Rewards & Drops
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {event.rewards.map((reward: string) => (
              <li key={reward} className="flex items-center gap-3 text-gray-300 bg-zinc-900/50 border border-white/5 p-3 rounded-lg hover:border-white/10 transition">
                <span className={`text-xl ${event.panelKey === "codm" ? "text-orange-400" : "text-yellow-400"}`}>✦</span>
                <span className="text-sm font-medium">{reward}</span>
              </li>
            ))}
          </ul>
        </section>

        {players.length > 0 && (
          <section className="bg-zinc-900/30 border border-white/10 rounded-xl p-5 backdrop-blur-md">
            <h2 className="mb-4 font-barlow text-xl font-bold uppercase text-white">
              Featured Cards
            </h2>
            <div className="flex flex-col gap-3">
              {players.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="group flex items-center gap-3 rounded-lg bg-zinc-950/50 p-3 ring-1 ring-white/5 hover:ring-white/15 transition"
                >
                  <div className="text-2xl">{player.glyph}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{player.name}</h3>
                    <p className="text-[10px] text-gray-400">{player.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Related Articles & Creative Coverage ── */}
      {relatedArticles.length > 0 && (
        <section className="mb-12 border-t border-white/5 pt-10">
          <h2 className="mb-6 font-barlow text-2xl font-bold uppercase text-white">
            Articles & Creative Coverage
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((article) => {
              const dateStr = article.published_at
                ? new Date(article.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
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
                    <h3 className="font-barlow text-xl font-bold uppercase text-white group-hover:text-orange-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-[10px] text-white/45 mt-1">{dateStr}</p>
                    <p className="text-sm leading-6 text-white/60 mt-3 line-clamp-3">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Guide & Story</span>
                    <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300">
                      Read Story →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Related Games & Upcoming Releases ── */}
      {relatedReleases.length > 0 && (
        <section className="mb-12 border-t border-white/5 pt-10">
          <h2 className="mb-6 font-barlow text-2xl font-bold uppercase text-white">
            Related Game Releases
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedReleases.map((release) => {
              const dateStr = release.release_date
                ? new Date(release.release_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "TBD";
              return (
                <Link
                  key={release.id}
                  href={`/release/${release.slug}`}
                  className="group relative flex flex-col justify-between overflow-hidden border border-white/10 bg-zinc-900/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 rounded-lg"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-22 shrink-0 relative bg-zinc-950 rounded overflow-hidden border border-white/5 shadow-md">
                      {release.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={release.cover_url}
                          alt={release.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20 uppercase font-bold">
                          No Cover
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] bg-sky-500/10 border border-sky-500/20 text-sky-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        Release
                      </span>
                      <h3 className="font-barlow text-lg font-bold uppercase text-white mt-1.5 leading-tight group-hover:text-sky-300 transition-colors truncate">
                        {release.title}
                      </h3>
                      <p className="text-xs text-white/45 mt-0.5">{dateStr}</p>
                    </div>
                  </div>
                  {release.summary && (
                    <p className="text-xs leading-relaxed text-white/50 mt-3 line-clamp-2">
                      {release.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                    <span className="text-[10px] text-white/30 uppercase">IGDB Tracker</span>
                    <span className="text-xs font-bold text-sky-400 group-hover:text-sky-300">
                      View Release →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

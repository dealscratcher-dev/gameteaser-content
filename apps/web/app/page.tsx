import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import Hero, { type HeroTag } from "@/components/layout/Hero";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ReleaseWheel, { type Release } from "@/components/countdown/ReleaseWheel";
import HoloGrid from "@/components/cards/HoloGrid";
import { TaxonomyExplorer } from "@/components/taxonomy/TaxonomyExplorer";
import type { HoloCardProps, HoloRarity } from "@/components/cards/HoloCard";
import type { Vertical } from "@/hooks/useEventImages";

// ─── Constants ───────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Countdowns", href: "#countdowns" },
  { label: "New Releases", href: "#new-releases" },
  { label: "Track", href: "#track" },
  { label: "Blogs", href: "#blogs" },
];

const HERO_TAGS: HeroTag[] = [
  { label: "Game seasons", variant: "codm" },
  { label: "Anime finales", variant: "anime" },
  { label: "Comic-Con dates", variant: "comicon" },
];

// ─── Helper functions ───────────────────────────────────────────────────
function getActiveVerticalFromDb(items: any[]): Vertical {
  const now = new Date();
  const active = items.filter(item => {
    const target = item.target_timestamp ? new Date(item.target_timestamp) : null;
    return target && target > now;
  });
  if (active.length === 0) return "games";
  return "games";
}

function eventDate(item: any) {
  const date = item.release_date || item.target_timestamp;
  if (!date) return "TBD";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function daysUntil(item: any) {
  const target = item.target_timestamp ? new Date(item.target_timestamp) : null;
  if (!target) return 0;
  const ms = target.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

// ─── UI primitives ──────────────────────────────────────────────────────
function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title?: string;
  copy?: string;
}) {
  return (
    <div className="mb-7 flex max-w-3xl flex-col gap-2">
      <p className="font-[family-name:var(--font-ibm-plex)] text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-300/80">
        {eyebrow}
      </p>
      {title && (
        <h2 className="font-[family-name:var(--font-barlow-condensed)] text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-5xl">
          {title}
        </h2>
      )}
      {copy && (
        <p className="max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
          {copy}
        </p>
      )}
    </div>
  );
}

// ─── Helper to map DB status to ReleaseWheel status ────────────────────
function mapStatus(dbStatus: string): "past" | "current" | "upcoming" {
  switch (dbStatus) {
    case "completed": return "past";
    case "ongoing":   return "current";
    case "announced": return "upcoming";
    default:          return "upcoming";
  }
}

// ─── Helper to derive posterTitle from franchise slug ──────────────────
function getPosterTitle(slug: string): string {
  switch (slug) {
    case "black-ops":      return "BO";
    case "modern-warfare": return "MW";
    case "warzone":        return "WZ";
    case "god-of-war":     return "GOW";
    default:               return slug.slice(0, 2).toUpperCase();
  }
}

// ─── Page ───────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // ============================================================
  // 1. Fetch data for Countdown Wheels (franchises + releases)
  // ============================================================
  // Use explicit any[] type to avoid TypeScript inference issues on Netlify
  const { data: franchises } = await supabase
    .from("franchises")
    .select("*")
    .order("name") as { data: any[] | null };

  const { data: allReleases } = await supabase
    .from("releases")
    .select("*")
    .order("display_order") as { data: any[] | null };

  // Safety: ensure arrays exist
  const safeFranchises = franchises || [];
  const safeReleases = allReleases || [];

  const wheelsData = safeFranchises
    .map(franchise => {
      const franchiseReleases = safeReleases
        .filter((r: any) => r.franchise_id === franchise.id)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          short: r.short_code,
          status: mapStatus(r.status),
          releaseDate: r.release_date
            ? new Date(r.release_date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "TBD",
          targetDate: r.target_timestamp
            ? new Date(r.target_timestamp).toISOString()
            : undefined,
          coverUrl: r.cover_url,
        }));
      return {
        franchise,
        releases: franchiseReleases,
      };
    })
    .filter(w => w.releases.length > 0);

  // ============================================================
  // 2. Other sections still use content_items (unchanged)
  // ============================================================
  let publishedItems: any[] = [];
  try {
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .eq("status", "published")
      .limit(200);
    if (data) publishedItems = data;
  } catch (err) {
    console.error("Failed to load published content items:", err);
  }

  const upcomingItems = publishedItems
    .filter((item) => item.target_timestamp && new Date(item.target_timestamp) > new Date())
    .sort((a, b) => new Date(a.target_timestamp).getTime() - new Date(b.target_timestamp).getTime())
    .slice(0, 12);

  const curatedReleases = publishedItems
    .filter((item) => {
      const route = item.metadata?.section_route;
      return (
        item.type === "release" &&
        (route === "curated-drops" || (item.quality_score && item.quality_score > 0.7))
      );
    })
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  // Latest blog / article posts for the #blogs section
  const latestBlogPosts = publishedItems
    .filter((item) => item.type === "article")
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 3);

  const holoCards: HoloCardProps[] = publishedItems
    .filter((item) => ["release", "game", "anime", "comicon"].includes(item.type))
    .slice(0, 20)
    .map((item) => {
      let vertical: "games" | "anime" | "comicon" = "games";
      if (item.type === "anime") vertical = "anime";
      else if (item.type === "comicon") vertical = "comicon";

      const score = item.quality_score ?? 0.5;
      let rarity: HoloRarity = "rare";
      if (score > 0.8) rarity = "legendary";
      else if (score > 0.5) rarity = "epic";

      const firstPlatform = item.platforms?.[0] || "";
      const eyebrow = firstPlatform || (vertical === "games" ? "Multi-platform" : vertical);

      return {
        slug: item.slug || item.id,
        title: item.title,
        subtitle: item.genres?.join(", ") || "Action, Adventure",
        eyebrow: eyebrow,
        image: item.cover_url || "/assets/hero-banner.png",
        imageAlt: `${item.title} inspired card art`,
        href: item.slug ? `/release/${item.slug}` : `/events/${item.id}`,
        rarity: rarity,
        variant: vertical === "games" ? "release" : "event",
        tags: [vertical, ...(item.platforms || []), ...(item.genres || [])],
        likeCount: Math.round(score * 420),
        isNew: true,
      };
    });

  const countByVertical = {
    games: publishedItems.filter((i) => i.type === "release" || i.type === "game").length,
    anime: publishedItems.filter((i) => i.type === "anime").length,
    comicon: publishedItems.filter((i) => i.type === "comicon").length,
  };

  const verticalStyles = {
    games: "border-orange-500/25 bg-orange-500/10 text-orange-100",
    anime: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100",
    comicon: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
  };

  const activeVertical = getActiveVerticalFromDb(publishedItems);

  return (
    <>
      <SiteHeader
        navItems={NAV_ITEMS}
        showSearch={false}
        showNotifications={false}
        showAuth={false}
      />

      <main className="min-h-screen overflow-hidden bg-zinc-950">
        <Hero
          activeVertical={activeVertical}
          title="What's ending soon?"
          highlight="Stay tuned before you miss it."
          tags={HERO_TAGS}
          ctaLabel="Track The Drops"
          ctaHref="#countdowns"
          note="Fan hub, not official. AI index"
          className="min-h-[620px] sm:min-h-[680px]"
        />

        {/* Countdown Wheels - now fully driven by franchises & releases */}
        <section
          id="countdowns"
          aria-labelledby="countdowns-heading"
          className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6"
        >
          <SectionHeading
            eyebrow="Game Launcher Dashboard"
            title="Franchise Timeline & Releases"
            copy="Browse the series timelines. Track past launches, current updates, and upcoming rollouts with active countdowns."
          />

          {wheelsData.length > 0 ? (
            <div className="grid gap-y-8 gap-x-6 lg:grid-cols-2">
              {wheelsData.map(({ franchise, releases }) => (
                <ReleaseWheel
                  key={franchise.id}
                  posterSrc={franchise.poster_url}
                  posterAlt={franchise.poster_alt}
                  eyebrow={franchise.eyebrow}
                  posterTitle={getPosterTitle(franchise.slug)}
                  releases={releases}
                />
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-center py-12">
              No releases found. Add franchises and releases to get started.
            </p>
          )}
        </section>

        {/* Upcoming drops */}
        <section
          aria-labelledby="upcoming-heading"
          className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6"
        >
          <SectionHeading
            eyebrow="Upcoming drops"
            title="The next things on the board"
            copy="Sorted from soonest to latest so you never miss the next deadline."
          />

          {upcomingItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {upcomingItems.map((item) => {
                const remaining = daysUntil(item);
                const vertical = item.type === "anime" ? "anime" : item.type === "comicon" ? "comicon" : "games";
                return (
                  <Link
                    key={item.id}
                    href={item.slug ? `/release/${item.slug}` : `/events/${item.id}`}
                    className="group border border-white/10 bg-zinc-900/60 p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded-lg"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${verticalStyles[vertical]}`}>
                        {item.type}
                      </span>
                      <span className="text-xs text-white/35">{eventDate(item)}</span>
                    </div>
                    <h3 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase leading-none tracking-tight text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-white/45">{item.summary}</p>
                    {item.platforms && item.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
                        {item.platforms.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">
                            {tag}
                          </span>
                        ))}
                        {item.platforms.length > 3 && (
                          <span className="text-[9px] text-white/35">+{item.platforms.length - 3} more</span>
                        )}
                      </div>
                    )}
                    <p
                      className={`mt-5 font-[family-name:var(--font-barlow-condensed)] text-xl font-extrabold uppercase ${
                        remaining <= 3 && remaining > 0
                          ? "text-red-400"
                          : remaining <= 7 && remaining > 0
                          ? "text-amber-400"
                          : "text-orange-300"
                      }`}
                    >
                      {remaining > 0 ? `${remaining} days left` : "ended"}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-white/50 text-center py-12">No upcoming drops scheduled.</p>
          )}
        </section>

        {/* New Releases (HoloGrid) */}
        <section
          id="new-releases"
          aria-labelledby="new-releases-heading"
          className="bg-white/[0.03] py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <HoloGrid
              cards={holoCards}
              heading="New Releases"
              subheading="Fresh drops across games, anime, and conventions — straight from the database."
              layout="grid"
              showToolbar
            />
          </div>
        </section>

        {/* Curated Releases */}
        <section
          aria-labelledby="curated-heading"
          className="bg-white/[0.01] border-y border-white/5 py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <SectionHeading
              eyebrow="Curated Game Drops"
              title="Vetted Releases & Countdowns"
              copy="Curated by the community, approved by admins, and powered by IGDB."
            />

            {curatedReleases.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
                {curatedReleases.map((item) => {
                  const dateStr = item.release_date
                    ? new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(item.release_date))
                    : "TBD";

                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col justify-between overflow-hidden border border-white/10 bg-zinc-900/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 rounded-lg"
                    >
                      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="flex gap-4">
                        <div className="w-20 h-28 shrink-0 relative bg-zinc-950 rounded overflow-hidden border border-white/5 shadow-md">
                          {item.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.cover_url}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase font-[family-name:var(--font-barlow-condensed)]">
                              No Cover
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] border border-orange-500/25 bg-orange-500/10 text-orange-200 px-2 py-0.5 rounded">
                            {item.type || "release"}
                          </span>
                          <h3 className="font-[family-name:var(--font-barlow-condensed)] text-xl font-extrabold uppercase leading-tight tracking-tight text-white mt-2 group-hover:text-orange-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-white/45 mt-1 font-medium">{dateStr}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        {item.summary && (
                          <p className="text-xs leading-5 text-white/50 line-clamp-3 mb-4">{item.summary}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {item.platforms?.slice(0, 3).map((plat: string) => (
                            <span key={plat} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">
                              {plat}
                            </span>
                          ))}
                          {item.platforms && item.platforms.length > 3 && (
                            <span className="text-[9px] text-white/35">+{item.platforms.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                        <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                          Source: {item.source}
                        </span>
                        {item.external_url && item.external_url !== "#" && (
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                          >
                            Link ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/50 text-center py-12">No curated releases yet.</p>
            )}
          </div>
        </section>

        {/* What we track / Hologram Roster - VHS style with TaxonomyExplorer */}
        <section
          id="track"
          aria-labelledby="track-heading"
          className="bg-white/[0.03] py-12 sm:py-16"
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
            .vhs-track-shelf {
              background:
                radial-gradient(circle at top, rgba(255,180,80,.06), transparent 50%),
                #0e0b08;
              border: 1px solid #2e2415;
              border-radius: 8px;
              overflow: hidden;
            }
            .vhs-track-header {
              padding: 16px 20px 12px;
              border-bottom: 1px solid #2a1e10;
              background: linear-gradient(180deg, #1a140d 0%, #150f09 100%);
            }
            .vhs-track-eyebrow {
              font-family: 'IBM Plex Mono', monospace;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.28em;
              text-transform: uppercase;
              color: #7a6040;
              margin-bottom: 6px;
            }
            .vhs-track-title {
              font-family: 'Kalam', cursive;
              font-weight: 700;
              font-size: 18px;
              color: #e8d8b0;
              line-height: 1.2;
            }
            .vhs-track-tape-list {
              padding: 16px 20px 20px;
              display: flex;
              flex-direction: column;
              gap: 0;
            }
            .vhs-track-tape {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #0d0a06;
              border: 1.5px solid #3a2818;
              border-radius: 2px;
              padding: 0 16px;
              height: 72px;
              margin-top: -2px;
              position: relative;
              overflow: hidden;
              transition: transform 0.25s cubic-bezier(.15,.85,.35,1), box-shadow 0.25s ease;
            }
            .vhs-track-tape:first-child { margin-top: 0; }
            .vhs-track-tape:hover {
              transform: translateX(10px);
              box-shadow: -8px 4px 24px rgba(0,0,0,.9);
              z-index: 2;
              border-color: #6a5030;
            }
            .vhs-track-tape-label {
              position: absolute;
              left: 10px; top: 50%;
              transform: translateY(-50%);
              width: 62%;
              height: 52px;
              background: linear-gradient(rgba(255,255,255,.06), rgba(0,0,0,.04)), #ede3c5;
              border-radius: 1px;
              display: flex;
              align-items: center;
              padding: 0 14px;
              box-shadow: inset 0 1px rgba(255,255,255,.35), inset 0 -1px rgba(0,0,0,.06);
              overflow: hidden;
            }
            .vhs-track-tape-label::after {
              content: '';
              position: absolute;
              right: -3px; top: 0; bottom: 0;
              width: 6px;
              background: linear-gradient(to right, #d4c9a0, #b8a87a, transparent);
              clip-path: polygon(0 0, 60% 8%, 100% 3%, 80% 22%, 100% 40%, 70% 55%, 100% 70%, 80% 88%, 100% 100%, 0 100%);
            }
            .vhs-track-tape-name {
              font-family: 'Kalam', cursive;
              font-weight: 700;
              font-size: 22px;
              color: #150900;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              line-height: 1;
              white-space: nowrap;
            }
            .vhs-track-tape-count {
              font-family: 'IBM Plex Mono', monospace;
              font-size: 9px;
              color: #6b5a3a;
              margin-top: 3px;
              letter-spacing: 0.05em;
            }
            .vhs-track-tape-spine {
              position: absolute;
              right: 14px; top: 50%;
              transform: translateY(-50%);
              text-align: right;
            }
            .vhs-track-spine-label {
              font-family: 'IBM Plex Mono', monospace;
              font-size: 9px;
              color: #b7a68f;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              display: block;
            }
            .vhs-track-barcode {
              display: flex;
              gap: 1px;
              margin-top: 5px;
              justify-content: flex-end;
            }
            .vhs-track-barcode span {
              background: #5a4a35;
              display: block;
              height: 12px;
            }
            .vhs-track-tape--games { border-left: 3px solid #b05a10; }
            .vhs-track-tape--anime { border-left: 3px solid #8b3ab5; }
            .vhs-track-tape--comicon { border-left: 3px solid #0f8f9e; }
          `}</style>
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionHeading
                eyebrow="What we track"
                title="Games, anime, and convention windows"
                copy="Taxonomy-driven browsing — the component owns the UI, the data stays clean."
              />
              <div className="vhs-track-shelf">
                <div className="vhs-track-header">
                  <p className="vhs-track-eyebrow">— your collection —</p>
                  <p className="vhs-track-title">Active Windows</p>
                </div>
                <div className="vhs-track-tape-list">
                  {(["games", "anime", "comicon"] as const).map((vertical, i) => {
                    const spineLabels: Record<string, string> = {
                      games:   "Arcade",
                      anime:   "Bandai",
                      comicon: "Con Circuit",
                    };
                    const barcodes = [
                      [2,1,3,1,2],
                      [1,3,1,2,1],
                      [3,1,2,1,3],
                    ];
                    return (
                      <div key={vertical} className={`vhs-track-tape vhs-track-tape--${vertical}`}>
                        <div className="vhs-track-tape-label">
                          <div>
                            <div className="vhs-track-tape-name">
                              {vertical === "comicon" ? "Comic-Cons" : vertical}
                            </div>
                            <div className="vhs-track-tape-count">
                              {countByVertical[vertical] > 0
                                ? `${countByVertical[vertical]} active windows`
                                : "no entries yet"}
                            </div>
                          </div>
                        </div>
                        <div className="vhs-track-tape-spine">
                          <span className="vhs-track-spine-label">{spineLabels[vertical]}</span>
                          <div className="vhs-track-barcode">
                            {barcodes[i].map((w, bi) => (
                              <span key={bi} style={{ width: `${w}px` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <TaxonomyExplorer />
          </div>
        </section>

        {/* Blogs */}
        <section
          id="blogs"
          aria-labelledby="blogs-heading"
          className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="From the hub"
              title="Latest from the Blog"
              copy="Guides, breakdowns, and quick takes on what's dropping next."
            />
            <Link
              href="/blog"
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 hover:text-orange-400 transition-colors"
            >
              View all →
            </Link>
          </div>

          {/* Blog Posts Strip */}
          {latestBlogPosts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestBlogPosts.map((post) => {
                  const dateStr = post.published_at
                    ? new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(post.published_at))
                    : "";
                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col gap-3 border border-white/10 bg-zinc-900/60 hover:border-white/25 hover:bg-zinc-900/90 transition-all duration-300 p-4 rounded-lg"
                    >
                      {post.cover_url && (
                        <div className="aspect-video w-full overflow-hidden rounded bg-zinc-950 border border-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.cover_url}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5 flex-1">
                        {post.tags?.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-block w-fit text-[9px] font-bold uppercase tracking-[0.14em] bg-orange-500/10 border border-orange-500/20 text-orange-300/70 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        <h3 className="font-[family-name:var(--font-barlow-condensed)] text-lg font-extrabold uppercase leading-tight tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-xs leading-5 text-white/45 line-clamp-2">
                            {post.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                        <span className="text-[10px] text-white/30">{dateStr}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 group-hover:text-orange-300 transition-colors">
                          Read →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
          ) : (
            <p className="text-white/50 text-center py-12">No blog posts yet.</p>
          )}

          <div className="mt-10 flex flex-col gap-3 border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/55">
              Share the tracker with your squad before the reset clock gets rude.
            </p>
            <div className="grid gap-2 min-[420px]:flex min-[420px]:flex-wrap">
              <Link
                href="https://wa.me/?text=https%3A%2F%2Fthegamebit.online%2F"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 border border-emerald-400/40 px-4 py-2 text-center font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 hover:bg-emerald-500/10 transition-colors rounded"
              >
                WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        legalNote="Fan hub, not official. Dates should be checked against official game and event channels."
      />
    </>
  );
}

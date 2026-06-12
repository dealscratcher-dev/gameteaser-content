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
  { label: "Track", href: "#track" },
  { label: "Roster", href: "#roster" },
  { label: "Notes", href: "#notes" },
];

const HERO_TAGS: HeroTag[] = [
  { emoji: "🎮", label: "Game seasons", variant: "codm" },
  { emoji: "📺", label: "Anime finales", variant: "anime" },
  { emoji: "🦸", label: "Comic-Con dates", variant: "comicon" },
];

// ─── Helper functions ───────────────────────────────────────────────────
function getActiveVerticalFromDb(items: any[]): Vertical {
  // Find any active event based on target_timestamp or release_date
  const now = new Date();
  const active = items.filter(item => {
    const target = item.target_timestamp ? new Date(item.target_timestamp) : null;
    return target && target > now;
  });
  if (active.length === 0) return "games";
  // fallback – you can derive vertical from type
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

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="font-[family-name:var(--font-barlow-condensed)] text-3xl font-extrabold uppercase leading-none text-white">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
    </div>
  );
}

// ─── Helper to extract series tag from `tags` array ────────────────────
function getSeriesTag(item: any): string | null {
  if (!item.tags || !Array.isArray(item.tags)) return null;
  // Look for tags that end with "-series" (e.g. "black-ops-series")
  const seriesTag = item.tags.find((tag: string) => tag.endsWith("-series"));
  return seriesTag || null;
}

// ─── Page ───────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Fetch all published content items
  let publishedItems: any[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .eq("status", "published")
      .limit(200);
    if (data) publishedItems = data;
  } catch (err) {
    console.error("Failed to load published content items:", err);
  }

  // 2. Prepare data for ReleaseWheels: group releases by series tag
  const releasesBySeries = new Map<string, Release[]>();
  publishedItems
    .filter((item) => item.type === "countdown")
    .forEach((item) => {
      const seriesTag = getSeriesTag(item);
      if (!seriesTag) return;
      const metadata = item.metadata || {};
      const release: Release = {
        id: item.id, // use real id
        title: item.title,
        short: metadata.short_code || item.slug?.substring(0, 3).toUpperCase() || "???",
        status: metadata.wheel_status || "upcoming",
        releaseDate: metadata.release_label || item.release_date || "Coming Soon",
        targetDate: item.target_timestamp ? new Date(item.target_timestamp).toISOString() : undefined,
      };
      if (!releasesBySeries.has(seriesTag)) releasesBySeries.set(seriesTag, []);
      releasesBySeries.get(seriesTag)!.push(release);
    });

  // Sort releases inside each series by status (past → current → upcoming)
  for (const [_, releases] of releasesBySeries.entries()) {
    releases.sort((a, b) => {
      const order = { past: 1, current: 2, upcoming: 3 };
      return (order[a.status] || 0) - (order[b.status] || 0);
    });
  }

  // Convert map to array of wheels – show at most 4 wheels (can be increased)
  const wheels = Array.from(releasesBySeries.entries()).slice(0, 4);

  // 3. Stats counts
  const totalDrops = publishedItems.filter(
    (item) =>
      item.type === "release" || item.type === "event" || item.type === "anime" || item.type === "comicon"
  ).length;
  const totalHoloCards = publishedItems.filter(
    (item) => ["release", "game", "anime", "comicon"].includes(item.type)
  ).length;
  const activeTimers = publishedItems.filter(
    (item) => item.target_timestamp && new Date(item.target_timestamp) > new Date()
  ).length;

  // 4. Upcoming drops (any item with target_timestamp in the future, sorted)
  const upcomingItems = publishedItems
    .filter((item) => {
      if (!item.target_timestamp) return false;
      return new Date(item.target_timestamp) > new Date();
    })
    .sort((a, b) => new Date(a.target_timestamp).getTime() - new Date(b.target_timestamp).getTime())
    .slice(0, 12);

  // 5. Curated releases – high quality or explicitly routed
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

  // 6. Hologram cards – from DB only
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

  // 7. Vertical counts (for "What we track" section)
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
        {/* Hero */}
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

        {/* Stats bar */}
        <section aria-label="Platform statistics" className="border-y border-white/10 bg-zinc-950/95">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-3 md:px-6">
            <MiniStat value={`${totalDrops}`} label="tracked drops" />
            <MiniStat value={`${totalHoloCards}`} label="holo cards" />
            <MiniStat value={`${activeTimers}`} label="live game timers" />
          </div>
        </section>

        {/* Countdowns – Dynamic ReleaseWheels */}
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

          {wheels.length > 0 ? (
            <div className="grid gap-y-8 gap-x-6 lg:grid-cols-2">
              {wheels.map(([seriesTag, releases]) => {
                // Derive poster/title from seriesTag or first release's metadata
                const posterTitle = seriesTag.replace("-series", "").toUpperCase();
                const eyebrow = seriesTag.replace("-series", "").replace(/-/g, " ");
                // Use a default poster; you could also store a poster_url in metadata
                return (
                  <ReleaseWheel
                    key={seriesTag}
                    posterSrc="/assets/bo6_poster.png" // Replace with dynamic if needed
                    posterAlt={posterTitle}
                    eyebrow={eyebrow}
                    posterTitle={posterTitle}
                    releases={releases}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-white/50 text-center py-12">No releases found. Add some in the CMS.</p>
          )}
        </section>

        {/* What we track */}
        <section
          id="track"
          aria-labelledby="track-heading"
          className="bg-white/[0.03] py-12 sm:py-16"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionHeading
                eyebrow="What we track"
                title="Games, anime, and convention windows"
                copy="Taxonomy-driven browsing — the component owns the UI, the data stays clean."
              />
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {(["games", "anime", "comicon"] as const).map((vertical) => (
                  <div
                    key={vertical}
                    className={`border px-4 py-4 ${verticalStyles[vertical]}`}
                  >
                    <p className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase tracking-tight">
                      {vertical === "comicon" ? "Comic-cons" : vertical}
                    </p>
                    <p className="mt-1 text-sm opacity-70">
                      {countByVertical[vertical]} active windows
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <TaxonomyExplorer />
          </div>
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

        {/* Hologram Roster */}
        <section
          id="roster"
          aria-labelledby="roster-heading"
          className="bg-white/[0.03] py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <HoloGrid
              cards={holoCards}
              heading="Hologram Roster"
              subheading="Filterable cards generated from database entries."
              layout="grid"
              showToolbar
            />
          </div>
        </section>

        {/* Notes (still static because they are generic tips) */}
        <section
          id="notes"
          aria-labelledby="notes-heading"
          className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionHeading
              eyebrow="Stay tuned for more updates"
              title="Tips before the clock runs out"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["CODM", "Weeklies first. BP tiers do not wait."],
                  ["PUBG", "Stack missions before chasing late RP rewards."],
                  ["Heads up", "Dates can slip when official blogs update."],
                ] as const
              ).map(([title, copy]) => (
                <article key={title} className="border border-white/10 bg-zinc-900/70 p-5">
                  <h3 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase tracking-tight text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">{copy}</p>
                </article>
              ))}
            </div>
          </div>

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
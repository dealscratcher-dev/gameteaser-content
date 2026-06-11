import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import Hero, { type HeroTag } from "@/components/layout/Hero";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import CountdownCard from "@/components/countdown/CountdownCard";
import HoloGrid from "@/components/cards/HoloGrid";
import { TaxonomyExplorer } from "@/components/taxonomy/TaxonomyExplorer";
import {
  PLAYER_CARDS,
  SEASON_EVENTS,
  type PlayerCard,
  type SeasonEvent,
} from "@/lib/seasons/content";
import type { HoloCardProps, HoloRarity } from "@/components/cards/HoloCard";
import type { Vertical } from "@/hooks/useEventImages";

// ─── Constants ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Countdowns", href: "#countdowns" },
  { label: "Track",      href: "#track" },
  { label: "Roster",     href: "#roster" },
  { label: "Notes",      href: "#notes" },
];

const RARITY_BY_VERTICAL: Record<PlayerCard["vertical"], HoloRarity> = {
  games:   "legendary",
  anime:   "epic",
  comicon: "rare",
};

const VERTICAL_STYLES: Record<SeasonEvent["vertical"], string> = {
  games:   "border-orange-500/25 bg-orange-500/10 text-orange-100",
  anime:   "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100",
  comicon: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
};

const HERO_TAGS: HeroTag[] = [
  { emoji: "🎮", label: "CODM & PUBG seasons", variant: "codm"    },
  { emoji: "📺", label: "Anime finales",        variant: "anime"   },
  { emoji: "🦸", label: "Comic-Con dates",      variant: "comicon" },
];

// ─── Helpers ──────────────────────────────────────────────────────────

function getActiveVertical(): Vertical {
  const now = Date.now();
  const active = SEASON_EVENTS.filter(
    (e) => new Date(e.start).getTime() <= now && new Date(e.end).getTime() > now
  );
  if (active.length === 0) return "games";
  const soonest = active.reduce<SeasonEvent>((closest, e) =>
    new Date(e.end).getTime() < new Date(closest.end).getTime() ? e : closest,
  active[0]
  );
  return soonest.vertical as Vertical;
}

function eventDate(event: SeasonEvent) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(event.end));
}

function daysUntil(event: SeasonEvent) {
  const ms = new Date(event.end).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function cardForPlayer(player: PlayerCard, index: number): HoloCardProps {
  return {
    slug:      player.id,
    title:     player.name,
    subtitle:  player.role,
    eyebrow:   player.franchise,
    image:     "/assets/hero-banner.png",
    imageAlt:  `${player.name} inspired card art`,
    href:      `/events/${player.eventId}`,
    rarity:    RARITY_BY_VERTICAL[player.vertical] ?? "common",
    variant:   player.vertical === "games" ? "character" : "event",
    tags:      [player.vertical, player.tagline, player.franchise],
    likeCount: 420 - index * 19,
    rank:      index + 1,
    isNew:     index < 3,
  };
}

// ─── Type for tracking usage ───────────────────────────────────────────

type ContentItemSource = { id: string; type: string; slug?: string; metadata?: any };

// ─── Shared UI primitives ─────────────────────────────────────────────────────

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

// ─── Helper to parse routing hint from metadata ───────────────────────

function getRouteHint(item: any): string | null {
  if (!item.metadata) return null;
  try {
    const parsed = typeof item.metadata === "string" ? JSON.parse(item.metadata) : item.metadata;
    return parsed?.section_route || null;
  } catch {
    return null;
  }
}

// ─── Page ───────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activeVertical = getActiveVertical();
  const gameEvents     = SEASON_EVENTS.filter((e) => e.panelKey);

  // Fetch all published content items from DB
  let publishedItems: any[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("status", "published")
      .limit(100);
    
    if (data) {
      publishedItems = data;
    }
  } catch (err) {
    console.error("Failed to load published content items:", err);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DEDUPLICATION TRACKER: Track which DB items are used in which sections
  // ──────────────────────────────────────────────────────────────────────────
  const usedDbItems = new Set<string>(); // tracks IDs of used DB items

  function markAsUsed(item: ContentItemSource) {
    usedDbItems.add(item.id);
  }

  function isUsed(item: ContentItemSource): boolean {
    return usedDbItems.has(item.id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CURATED GAME DROPS: Respect admin routing preference
  // ──────────────────────────────────────────────────────────────────────────
  let displayReleases = publishedItems
    .filter((item) => {
      const route = getRouteHint(item);
      // Include items marked for curated drops OR high-quality releases by default
      return (route === "curated-drops" || (route === null && item.type === "release" && item.quality_score && item.quality_score > 0.7));
    })
    .sort((a, b) => {
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
    })
    .slice(0, 6);

  // Mark these items as used
  displayReleases.forEach((item) => markAsUsed(item));

  // Fallback if no published rows exist in the database
  if (displayReleases.length === 0) {
    displayReleases = SEASON_EVENTS.filter((e) => e.vertical === "games").slice(0, 6).map((e) => ({
      id: e.id,
      title: e.title,
      summary: e.subtitle,
      release_date: e.end,
      platforms: ["PC", "Console"],
      genres: ["Action"],
      cover_url: null,
      type: "release",
      source: "static-fallback",
      external_url: "#",
    }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CATEGORY WINDOWS GRID COUNTS
  // ──────────────────────────────────────────────────────────────────────────
  const dbGamesCount = publishedItems.filter((item) => item.type === "release" || item.type === "game").length;
  const dbAnimeCount = publishedItems.filter((item) => item.type === "anime").length;
  const dbComiconCount = publishedItems.filter((item) => item.type === "comicon").length;

  const getVerticalCount = (vertical: "games" | "anime" | "comicon") => {
    const staticCount = SEASON_EVENTS.filter((e) => e.vertical === vertical).length;
    let dbCount = 0;
    if (vertical === "games") dbCount = dbGamesCount;
    else if (vertical === "anime") dbCount = dbAnimeCount;
    else if (vertical === "comicon") dbCount = dbComiconCount;
    return dbCount + staticCount;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 3. UPCOMING DROPS: Respect routing + dedup (exclude already used items)
  // ──────────────────────────────────────────────────────────────────────────
  const seenTitles = new Set<string>();
  const mergedEvents: (SeasonEvent & { slug?: string; isFromDb?: boolean; dbId?: string })[] = [];

  // Add DB items first (those NOT already used + routed to upcoming-drops)
  publishedItems
    .filter((item) => {
      const route = getRouteHint(item);
      return (
        ["release", "event", "anime", "comicon"].includes(item.type) && 
        !isUsed(item) && // Only use items not already in Curated Game Drops
        (route === "upcoming-drops" || (route === null && ["anime", "event", "comicon"].includes(item.type)))
      );
    })
    .forEach((item) => {
      let vertical: "games" | "anime" | "comicon" = "games";
      if (item.type === "anime") vertical = "anime";
      else if (item.type === "comicon") vertical = "comicon";

      const titleKey = item.title.trim().toLowerCase();
      seenTitles.add(titleKey);

      mergedEvents.push({
        id: item.id,
        vertical,
        title: item.title,
        subtitle: item.summary || "",
        start: item.created_at || new Date().toISOString(),
        end: item.release_date || new Date().toISOString(),
        rewards: [...(item.platforms || []), ...(item.genres || [])],
        slug: item.slug,
        isFromDb: true,
        dbId: item.id,
      });

      markAsUsed(item); // Mark as used now
    });

  // Add static events if they are not already in seenTitles
  SEASON_EVENTS.forEach((e) => {
    const titleKey = e.title.trim().toLowerCase();
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      mergedEvents.push(e);
    }
  });

  // Sort timeline by date ascending (soonest to latest)
  const nextEvents = mergedEvents.sort(
    (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime()
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 4. HOLOGRAM ROSTER: Respect routing + dedup (exclude already used items)
  // ──────────────────────────────────────────────────────────────────────────
  const dbHoloCards: HoloCardProps[] = publishedItems
    .filter((item) => {
      const route = getRouteHint(item);
      return (
        ["release", "game", "anime", "comicon"].includes(item.type) && 
        !isUsed(item) && // Only use items not already used
        (route === "hologram-roster" || route === null) // Include items routed here or default
      );
    })
    .slice(0, 20)
    .map((item) => {
      let vertical: "games" | "anime" | "comicon" = "games";
      if (item.type === "anime") vertical = "anime";
      else if (item.type === "comicon") vertical = "comicon";

      const score = item.quality_score ?? 0.5;
      let rarity: HoloRarity = "rare";
      if (score > 0.8) rarity = "legendary";
      else if (score > 0.5) rarity = "epic";

      const firstPlatform = item.platforms && item.platforms.length > 0 ? item.platforms[0] : "";
      const eyebrow = firstPlatform || (vertical === "games" ? "Multi-platform" : vertical);

      markAsUsed(item); // Mark as used now

      return {
        slug: item.slug || item.id,
        title: item.title,
        subtitle: item.genres && item.genres.length > 0 ? item.genres.join(", ") : "Action, Adventure",
        eyebrow: eyebrow,
        image: item.cover_url || "/assets/hero-banner.png",
        imageAlt: `${item.title} inspired card art`,
        href: item.slug ? `/release/${item.slug}` : `/events/${item.id}`,
        rarity: rarity,
        variant: vertical === "games" ? "release" : "event",
        tags: [vertical, ...(item.platforms || []), ...(item.genres || [])],
        likeCount: Math.round(score * 420),
        rank: undefined,
        isNew: true,
      };
    });

  const holoCards = [...dbHoloCards, ...PLAYER_CARDS.map(cardForPlayer)];

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <SiteHeader
        navItems={NAV_ITEMS}
        showSearch={false}
        showNotifications={false}
        showAuth={false}
      />

      <main className="min-h-screen overflow-hidden bg-zinc-950">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
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

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <section aria-label="Platform statistics" className="border-y border-white/10 bg-zinc-950/95">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-3 md:px-6">
            <MiniStat value={`${nextEvents.length}`} label="tracked drops" />
            <MiniStat value={`${holoCards.length}`}  label="holo cards" />
            <MiniStat value={`${gameEvents.length}`}    label="live game timers" />
          </div>
        </section>

        {/* ── Countdowns ────────────────────────────────────────────────── */}
        <section
          id="countdowns"
          aria-labelledby="countdowns-heading"
          className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6"
        >
          <SectionHeading
            eyebrow="Live dashboards"
            title="Battle pass pressure, made visible"
            copy="CODM and PUBG timers sit up front because these are the deadlines people actually miss."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            {gameEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded-lg"
              >
                <CountdownCard
                  title={event.title}
                  subtitle={event.subtitle}
                  endDate={event.end}
                  startDate={event.start}
                  badge={event.panelKey === "codm" ? "CODM" : "PUBG"}
                  badgeVariant={event.panelKey}
                  accentVariant={event.panelKey}
                  countdownLabel={
                    event.panelKey === "codm"
                      ? "Time until season rollover"
                      : "Time until pass reset"
                  }
                  progressLabel={
                    event.panelKey === "codm"
                      ? "Season progress"
                      : "Royale pass timeline"
                  }
                  className="min-h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-white/25"
                />
              </Link>
            ))}
          </div>
        </section>

        {/* ── What we track ─────────────────────────────────────────────── */}
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
                    className={`border px-4 py-4 ${VERTICAL_STYLES[vertical]}`}
                  >
                    <p className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase tracking-tight">
                      {vertical === "comicon" ? "Comic-cons" : vertical}
                    </p>
                    <p className="mt-1 text-sm opacity-70">
                      {getVerticalCount(vertical)}{" "}
                      active windows
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <TaxonomyExplorer />
          </div>
        </section>

        {/* ── Upcoming drops ────────────────────────────────────────────── */}
        <section
          aria-labelledby="upcoming-heading"
          className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6"
        >
          <SectionHeading
            eyebrow="Upcoming drops"
            title="The next things on the board"
            copy="Sorted from soonest to latest so you never miss the next deadline."
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {nextEvents.map((event) => {
              const remaining = daysUntil(event);
              return (
                <Link
                  key={event.id}
                  href={event.slug ? `/release/${event.slug}` : `/events/${event.id}`}
                  className="group border border-white/10 bg-zinc-900/60 p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded-lg"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span
                      className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${VERTICAL_STYLES[event.vertical]}`}
                    >
                      {event.vertical}
                    </span>
                    <span className="text-xs text-white/35">{eventDate(event)}</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase leading-none tracking-tight text-white">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-white/45">
                    {event.subtitle}
                  </p>

                  {/* Platforms/Genres as card tags */}
                  {event.rewards && event.rewards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
                      {event.rewards.map((tag) => (
                        <span key={tag} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">
                          {tag}
                        </span>
                      ))}
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
        </section>

        {/* ── Curated Releases ─────────────────────────────────────────── */}
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              {displayReleases.map((item) => {
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
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="flex gap-4">
                      {/* Image Thumbnail */}
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

                      {/* Info */}
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
                        <p className="text-xs leading-5 text-white/50 line-clamp-3 mb-4">
                          {item.summary}
                        </p>
                      )}
                      
                      {/* Platform Badges */}
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
          </div>
        </section>

        {/* ── Hologram Roster ───────────────────────────────────────────── */}
        <section
          id="roster"
          aria-labelledby="roster-heading"
          className="bg-white/[0.03] py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <HoloGrid
              cards={holoCards}
              heading="Hologram Roster"
              subheading="Filterable cards generated from season data."
              layout="grid"
              showToolbar
            />
          </div>
        </section>

        {/* ── Notes ─────────────────────────────────────────────────────── */}
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
                  ["CODM",     "Weeklies first. BP tiers do not wait."],
                  ["PUBG",     "Stack missions before chasing late RP rewards."],
                  ["Heads up", "Dates can slip when official blogs update."],
                ] as const
              ).map(([title, copy]) => (
                <article
                  key={title}
                  className="border border-white/10 bg-zinc-900/70 p-5"
                >
                  <h3 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase tracking-tight text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">{copy}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Share bar */}
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

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <SiteFooter
        legalNote="Fan hub, not official. Dates should be checked against official game and event channels."
      />
    </>
  );
}
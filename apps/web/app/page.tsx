import Link from "next/link";
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

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const activeVertical = getActiveVertical();
  const gameEvents     = SEASON_EVENTS.filter((e) => e.panelKey);
  const nextEvents     = [...SEASON_EVENTS].sort(
    (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime()
  );
  const holoCards = PLAYER_CARDS.map(cardForPlayer);

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <SiteHeader
        logoText="GameTeaser"
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
            <MiniStat value={`${SEASON_EVENTS.length}`} label="tracked drops" />
            <MiniStat value={`${PLAYER_CARDS.length}`}  label="holo cards" />
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
                      {SEASON_EVENTS.filter((e) => e.vertical === vertical).length}{" "}
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
                  href={`/events/${event.id}`}
                  className="group border border-white/10 bg-zinc-900/60 p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
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
                href="https://wa.me/?text=https%3A%2F%2Fgameteaser.netlify.app%2F"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 border border-emerald-400/40 px-4 py-2 text-center font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400 hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                WhatsApp
              </Link>
              <Link
                href="/llms.txt"
                className="min-h-11 border border-white/15 px-4 py-2 text-center font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.18em] text-white/70 transition hover:border-orange-300 hover:text-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
              >
                LLM Index
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <SiteFooter
        companyName="GameTeaser"
        legalNote="Fan hub, not official. Dates should be checked against official game and event channels."
      />
    </>
  );
}

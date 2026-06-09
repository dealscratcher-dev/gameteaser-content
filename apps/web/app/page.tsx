import Link from "next/link";
import Hero from "@/components/layout/Hero";
import CountdownCard from "@/components/countdown/CountdownCard";
import { TaxonomyExplorer } from "@/components/taxonomy/TaxonomyExplorer";
import { SEASON_EVENTS } from "@/lib/seasons/content";

export default function HomePage() {
  const gameEvents = SEASON_EVENTS.filter((e) => e.panelKey);

  return (
    <>
      <Hero
        title="What's ending soon?"
        highlight="Stay tuned before you miss it."
        tags={[
          { emoji: "🎮", label: "CODM & PUBG seasons", variant: "codm" },
          { emoji: "📺", label: "Anime finales", variant: "anime" },
          { emoji: "🦸", label: "Comic-Con dates", variant: "comicon" },
        ]}
        note='Fan hub — not official. Like & share hologram cards below.'
      />

      <div className="container mx-auto px-4 py-12">
        <section aria-labelledby="countdowns-heading" className="mb-16">
          <h2 id="countdowns-heading" className="mb-2 font-barlow text-3xl font-extrabold uppercase tracking-tight text-white">
            Live Season Countdowns
          </h2>
          <p className="mb-8 text-gray-400">Never miss a battle pass reset or royale pass deadline.</p>

          <div className="grid gap-6 md:grid-cols-2">
            {gameEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <CountdownCard
                  title={event.title}
                  subtitle={event.subtitle}
                  endDate={event.end}
                  startDate={event.start}
                  badge={event.panelKey === "codm" ? "CODM" : "PUBG"}
                  badgeVariant={event.panelKey}
                  accentVariant={event.panelKey}
                  showProgress
                  progressLabel="Season progress"
                />
              </Link>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <Link
              href="/codm"
              className="rounded-none border border-orange-500 px-5 py-2 text-sm font-bold uppercase tracking-widest text-orange-400 transition hover:bg-orange-500 hover:text-zinc-950"
            >
              CODM Hub
            </Link>
            <Link
              href="/pubg"
              className="rounded-none border border-yellow-400 px-5 py-2 text-sm font-bold uppercase tracking-widest text-yellow-300 transition hover:bg-yellow-400 hover:text-zinc-950"
            >
              PUBG Hub
            </Link>
          </div>
        </section>

        <section aria-labelledby="taxonomy-heading" className="mb-16">
          <h2 id="taxonomy-heading" className="mb-2 font-barlow text-3xl font-extrabold uppercase tracking-tight text-white">
            Explore Universes
          </h2>
          <p className="mb-8 text-gray-400">Browse categories, genres, and trending tags.</p>
          <TaxonomyExplorer />
        </section>

        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="mb-6 font-barlow text-3xl font-extrabold uppercase tracking-tight text-white">
            All Upcoming Drops
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEASON_EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="rounded-lg bg-zinc-900 p-5 ring-1 ring-white/10 transition hover:ring-white/25"
              >
                <h3 className="font-semibold text-white">{event.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{event.subtitle}</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-gray-500">{event.vertical}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

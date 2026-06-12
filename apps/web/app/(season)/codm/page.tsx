import Link from "next/link";
import type { Metadata } from "next";
import HeroBanner from "@/components/layout/HeroBanner";
import CountdownCard from "@/components/countdown/CountdownCard";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getEventsByPanel, getPlayersByEvent } from "@/lib/seasons/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "COD Mobile Season Countdown",
  description: "Live countdown for CODM Season 5 — battle pass tiers, collab skins, and mythic draws.",
};

export default async function CodmSeasonPage() {
  const supabase = await createServerSupabaseClient();
  let mainEvent: any = null;

  try {
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("type", "event")
      .eq("status", "published")
      .filter("metadata->>panel_key", "eq", "codm")
      .order("release_date", { ascending: true }) // soonest ending first
      .limit(1);

    if (data && data.length > 0) {
      const dbEvent = data[0];
      mainEvent = {
        id: dbEvent.slug,
        title: dbEvent.title,
        subtitle: dbEvent.summary || "",
        start: dbEvent.metadata?.start_date || dbEvent.created_at,
        end: dbEvent.metadata?.end_date || dbEvent.release_date,
        rewards: dbEvent.metadata?.rewards || dbEvent.tags || [],
        panelKey: dbEvent.metadata?.panel_key || "codm",
      };
    }
  } catch (err) {
    console.error("Failed to load CODM event from database:", err);
  }

  // Fallback to static config
  if (!mainEvent) {
    const events = getEventsByPanel("codm");
    mainEvent = events[0];
  }

  // Retrieve players for hologram grid. Fallback to codm-s5 players if no players found for the db id
  let players = mainEvent ? getPlayersByEvent(mainEvent.id) : [];
  if (players.length === 0) {
    players = getPlayersByEvent("codm-s5");
  }

  return (
    <>
      <HeroBanner
        title="COD Mobile"
        highlight={mainEvent?.title.replace("COD Mobile — ", "") || "Season Details"}
        kicker="call of duty mobile"
        tags={[{ emoji: "🎮", label: mainEvent?.title || "Season Event", variant: "codm" }]}
        ctaLabel="View Event Details"
        ctaHref={mainEvent ? `/events/${mainEvent.id}` : "/"}
      />

      <div className="container mx-auto px-4 py-12">
        {mainEvent && (
          <section className="mb-12">
            <CountdownCard
              title={mainEvent.title}
              subtitle={mainEvent.subtitle}
              endDate={mainEvent.end}
              startDate={mainEvent.start}
              badge="LIVE"
              badgeVariant="codm"
              accentVariant="codm"
              showProgress
              progressLabel="Season progress"
            />

            <div className="mt-6">
              <h2 className="mb-3 font-barlow text-xl font-bold uppercase text-white">Rewards</h2>
              <ul className="flex flex-wrap gap-2">
                {mainEvent.rewards.map((reward: string) => (
                  <li key={reward} className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-300 ring-1 ring-orange-500/20">
                    {reward}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-6 font-barlow text-2xl font-bold uppercase text-white">Hologram Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="group rounded-lg bg-zinc-900 p-6 ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-orange-500/40"
                style={{
                  background: `linear-gradient(135deg, ${player.holo[0]}15, ${player.holo[1]}10, transparent)`,
                }}
              >
                <div className="text-4xl mb-3">{player.glyph}</div>
                <h3 className="font-barlow text-xl font-bold uppercase text-white group-hover:text-orange-400">
                  {player.name}
                </h3>
                <p className="text-sm text-gray-400">{player.role}</p>
                <p className="mt-2 text-xs text-gray-500">{player.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

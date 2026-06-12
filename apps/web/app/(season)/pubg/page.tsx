import Link from "next/link";
import type { Metadata } from "next";
import HeroBanner from "@/components/layout/HeroBanner";
import CountdownCard from "@/components/countdown/CountdownCard";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getEventsByPanel, getPlayersByEvent } from "@/lib/seasons/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PUBG Mobile Royale Pass Countdown",
  description: "Live countdown for PUBG Mobile Royale Pass A19 — mythic sets, 3D finishes, and UC rebates.",
};

export default async function PubgSeasonPage() {
  const supabase = await createServerSupabaseClient();
  let mainEvent: any = null;

  try {
    const { data } = await (supabase.from("content_items") as any)
      .select("*")
      .eq("type", "event")
      .eq("status", "published")
      .filter("metadata->>panel_key", "eq", "pubg")
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
        panelKey: dbEvent.metadata?.panel_key || "pubg",
      };
    }
  } catch (err) {
    console.error("Failed to load PUBG event from database:", err);
  }

  // Fallback to static config
  if (!mainEvent) {
    const events = getEventsByPanel("pubg");
    mainEvent = events[0];
  }

  // Retrieve players for hologram grid. Fallback to pubg-a19 players if no players found for the db id
  let players = mainEvent ? getPlayersByEvent(mainEvent.id) : [];
  if (players.length === 0) {
    players = getPlayersByEvent("pubg-a19");
  }

  return (
    <>
      <HeroBanner
        title="PUBG Mobile"
        highlight={mainEvent?.title.replace("PUBG Mobile — ", "") || "Royale Pass"}
        kicker="battlegrounds mobile"
        tags={[{ emoji: "🪖", label: mainEvent?.title || "Royale Pass", variant: "pubg" }]}
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
              badge="ROYALE PASS"
              badgeVariant="pubg"
              accentVariant="pubg"
              showProgress
              progressLabel="Pass progress"
            />

            <div className="mt-6">
              <h2 className="mb-3 font-barlow text-xl font-bold uppercase text-white">Rewards</h2>
              <ul className="flex flex-wrap gap-2">
                {mainEvent.rewards.map((reward: string) => (
                  <li key={reward} className="rounded-full bg-yellow-400/10 px-3 py-1 text-sm text-yellow-300 ring-1 ring-yellow-400/20">
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
                className="group rounded-lg bg-zinc-900 p-6 ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-yellow-400/40"
                style={{
                  background: `linear-gradient(135deg, ${player.holo[0]}15, ${player.holo[1]}10, transparent)`,
                }}
              >
                <div className="text-4xl mb-3">{player.glyph}</div>
                <h3 className="font-barlow text-xl font-bold uppercase text-white group-hover:text-yellow-300">
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

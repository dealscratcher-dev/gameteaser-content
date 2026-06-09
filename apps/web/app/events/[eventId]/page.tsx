import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CountdownCard from "@/components/countdown/CountdownCard";
import { getEventById, getPlayersByEvent } from "@/lib/seasons/content";

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = getEventById(eventId);
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
  const event = getEventById(eventId);

  if (!event) notFound();

  const players = getPlayersByEvent(event.id);
  const badgeVariant = event.panelKey ?? "default";
  const accentVariant = event.panelKey ?? "default";

  return (
    <main className="container mx-auto px-4 py-8">
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

      <section className="mb-10 max-w-2xl">
        <h2 className="mb-4 font-barlow text-2xl font-bold uppercase text-white">Rewards & Drops</h2>
        <ul className="space-y-2">
          {event.rewards.map((reward) => (
            <li key={reward} className="flex items-center gap-3 text-gray-300">
              <span className="text-orange-400">✦</span>
              {reward}
            </li>
          ))}
        </ul>
      </section>

      {players.length > 0 && (
        <section>
          <h2 className="mb-6 font-barlow text-2xl font-bold uppercase text-white">Featured Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="rounded-lg bg-zinc-900 p-5 ring-1 ring-white/10 transition hover:ring-white/25"
              >
                <div className="text-3xl mb-2">{player.glyph}</div>
                <h3 className="font-semibold text-white">{player.name}</h3>
                <p className="text-sm text-gray-400">{player.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

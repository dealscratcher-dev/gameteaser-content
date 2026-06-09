import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPlayerById, getEventById } from "@/lib/seasons/content";

interface PlayerPageProps {
  params: Promise<{ playerId: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { playerId } = await params;
  const player = getPlayerById(playerId);
  if (!player) return { title: "Player Not Found" };

  return {
    title: `${player.name} — ${player.franchise}`,
    description: `${player.role} · ${player.tagline}`,
    openGraph: {
      images: [`/api/og?title=${encodeURIComponent(player.name)}&subtitle=${encodeURIComponent(player.tagline)}`],
    },
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerId } = await params;
  const player = getPlayerById(playerId);

  if (!player) notFound();

  const event = getEventById(player.eventId);

  return (
    <main className="container mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-400">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-white">Home</Link></li>
          <li aria-hidden="true">/</li>
          {event && (
            <>
              <li>
                <Link href={`/events/${event.id}`} className="hover:text-white">
                  {event.title}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li aria-current="page" className="text-white">{player.name}</li>
        </ol>
      </nav>

      <article
        className="relative mx-auto max-w-md overflow-hidden rounded-xl p-8 ring-1 ring-white/15"
        style={{
          background: `linear-gradient(145deg, ${player.holo[0]}30, ${player.holo[1]}20, #09090b 60%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${player.holo[2]}40, transparent 50%), radial-gradient(circle at 70% 80%, ${player.holo[0]}30, transparent 50%)`,
          }}
        />

        <div className="relative z-10 text-center">
          <div className="mb-4 text-7xl">{player.glyph}</div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{player.franchise}</p>
          <h1 className="mt-2 font-barlow text-4xl font-extrabold uppercase tracking-tight text-white">
            {player.name}
          </h1>
          <p className="mt-2 text-lg text-gray-300">{player.role}</p>
          <p className="mt-4 text-sm italic text-gray-400">{player.tagline}</p>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              className="rounded-none border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:border-orange-500 hover:text-orange-400"
            >
              Like
            </button>
            <button
              type="button"
              className="rounded-none bg-orange-500 px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-950 transition hover:bg-orange-400"
            >
              Share
            </button>
          </div>
        </div>
      </article>

      {event && (
        <div className="mt-8 text-center">
          <Link
            href={`/events/${event.id}`}
            className="text-sm text-gray-400 hover:text-orange-400"
          >
            ← Back to {event.title}
          </Link>
        </div>
      )}
    </main>
  );
}

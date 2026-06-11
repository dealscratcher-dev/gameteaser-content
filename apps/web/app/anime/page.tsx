// apps/web/app/anime/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anime | TheGameBit",
  description: "Discover anime series, characters, and universes.",
};

export default function AnimePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Anime
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Discover anime series, characters, and universes.
      </p>
    </main>
  );
}

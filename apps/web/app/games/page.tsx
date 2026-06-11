// apps/web/app/games/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games | TheGameBit",
  description: "Explore the latest and greatest in gaming.",
};

export default function GamesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Games
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Explore the latest and greatest in gaming.
      </p>
    </main>
  );
}

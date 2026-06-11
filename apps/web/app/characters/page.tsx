// apps/web/app/characters/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Characters | TheGameBit",
  description: "Browse all characters across games, anime, and more.",
};

export default function CharactersPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Characters
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Browse all characters across games, anime, and more.
      </p>
    </main>
  );
}

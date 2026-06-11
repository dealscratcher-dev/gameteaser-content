// apps/web/app/movies/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movies | TheGameBit",
  description: "Browse movies, trailers, and film universes.",
};

export default function MoviesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Movies
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Browse movies, trailers, and film universes.
      </p>
    </main>
  );
}

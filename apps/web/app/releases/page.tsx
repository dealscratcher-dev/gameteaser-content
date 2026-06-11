// apps/web/app/releases/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Releases | TheGameBit",
  description: "Latest drops, launches, and release dates.",
};

export default function ReleasesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Releases
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Latest drops, launches, and release dates.
      </p>
    </main>
  );
}

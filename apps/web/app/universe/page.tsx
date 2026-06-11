import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Universe | TheGameBit",
  description: "Explore all connected universes on TheGameBit.",
};

export default function UniversePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Universe
      </h1>
      <p className="mt-4 text-sm text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Explore all connected universes on TheGameBit.
      </p>
    </main>
  );
}
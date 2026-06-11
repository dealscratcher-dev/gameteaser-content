import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events | TheGameBit",
  description: "Upcoming and ongoing events in the fandom world.",
};

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Events
      </h1>
      <p className="mt-4 text-sm text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Upcoming and ongoing events in the fandom world.
      </p>
    </main>
  );
}
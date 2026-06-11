// apps/web/app/(company)/about/page.tsx

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — TheGameBit",
  description:
    "About TheGameBit — a fan-run countdown and guide site for mobile game seasons, anime schedules, and comic convention dates.",
  alternates: { canonical: "https://thegamebit.online/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">

      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        About TheGameBit
      </h1>
      <p className="mt-6 text-base leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
        We help mobile gamers and pop-culture fans answer one question:{" "}
        <em className="text-white/80">
          how much time is left before the thing I care about ends?
        </em>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
        TheGameBit launched as a practical tool for players who juggle Call of
        Duty Mobile seasons, PUBG Mobile Royale Pass deadlines, anime simulcast
        finales, and comic convention dates. Instead of digging through social
        feeds or patch notes at the last minute, you get live countdowns,
        plain-language tips, and shareable links for your squad.
      </p>

      {/* What we publish */}
      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          What we publish
        </h2>
        <ul className="space-y-3 text-sm text-white/60 font-[family-name:var(--font-ibm-plex)]">
          {[
            {
              strong: "Live countdown timers",
              rest: "for game seasons and battle passes with progress bars and reward highlights.",
            },
            {
              strong: "Editorial guides",
              rest: "on how to finish passes efficiently, written for free-to-play and premium players.",
            },
            {
              strong: "Event calendars",
              rest: "for anime cour endings and major comic conventions (dates updated when official sources publish).",
            },
          ].map(({ strong, rest }) => (
            <li key={strong} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
              <span>
                <strong className="text-white/80">{strong}</strong> {rest}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <div className="mt-10 rounded-lg border border-orange-500/20 bg-orange-500/5 px-5 py-4">
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          <strong className="text-white/80">Disclaimer:</strong> TheGameBit is
          an independent fan website. We are not affiliated with, endorsed by,
          or sponsored by Activision, Krafton, Tencent, anime licensors, or
          convention organizers. Game names and trademarks belong to their
          owners. Countdown dates are estimates unless cited from official
          announcements — always verify in-game.
        </p>
      </div>

      {/* Editorial standards */}
      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Editorial standards
        </h2>
        <p className="text-sm leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
          Our guides focus on actionable advice: weekly mission priority,
          realistic F2P timelines, and when a season is worth your time. We do
          not publish cheats, hacks, or policy-breaking content. When dates
          change after a patch, we update timers and note the change in our
          guides.
        </p>
      </section>

      {/* Advertising */}
      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Advertising
        </h2>
        <p className="text-sm leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
          We may display Google AdSense advertisements to support hosting costs.
          See our{" "}
          <Link
            href="/privacy"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            Privacy Policy
          </Link>{" "}
          for how cookies and ad partners work.
        </p>
      </section>

      <div className="mt-12">
        <Link
          href="/"
          className="text-sm text-white/30 hover:text-white transition-colors font-[family-name:var(--font-ibm-plex)]"
        >
          ← Back to countdowns
        </Link>
      </div>

    </main>
  );
}

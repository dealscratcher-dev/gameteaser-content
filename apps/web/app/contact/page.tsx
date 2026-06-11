// apps/web/app/(support)/contact/page.tsx

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — TheGameBit",
  description:
    "Contact TheGameBit for corrections, feedback, privacy requests, or advertising questions.",
  alternates: { canonical: "https://thegamebit.online/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">

      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Contact us
      </h1>
      <p className="mt-4 text-base leading-relaxed text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Wrong season date? Privacy question? We'd like to hear from you.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Email
        </h2>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          Reach the site owner at{" "}
          <a
            href="mailto:contact@thegamebit.online"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            contact@thegamebit.online
          </a>
          .
        </p>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          We typically respond within 3–5 business days. For season date
          corrections, include a link to the official patch notes or an
          in-game news screenshot if possible.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          What to contact us about
        </h2>
        <ul className="space-y-2 text-sm text-white/60 font-[family-name:var(--font-ibm-plex)]">
          {[
            "Season or pass end date corrections (with source link)",
            "Privacy and cookie questions",
            "Copyright or trademark concerns",
            "General feedback on guides and timers",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Mail
        </h2>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          TheGameBit operates as an online publication at{" "}
          <strong className="text-white/80">thegamebit.online</strong>. We do
          not offer phone support.
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

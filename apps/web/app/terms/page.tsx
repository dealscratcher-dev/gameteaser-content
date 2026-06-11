// apps/web/app/(support)/terms/page.tsx

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — TheGameBit",
  description: "Terms of Use for TheGameBit (thegamebit.online).",
  alternates: { canonical: "https://thegamebit.online/terms" },
};

const SECTIONS = [
  {
    heading: "1. Service description",
    body: 'We provide countdown timers, editorial guides, and event information for entertainment purposes. Data is provided "as is" without warranty. Season end dates may be estimates — verify in official game clients before making purchase decisions.',
  },
  {
    heading: "2. No affiliation",
    body: "TheGameBit is not affiliated with Activision, Krafton, anime publishers, or convention organizers. All trademarks are property of their respective owners.",
  },
  {
    heading: "3. User conduct",
    body: "You may not scrape the site in ways that harm performance, attempt unauthorized access, or use our content to mislead others about official partnerships.",
  },
  {
    heading: "4. Advertising",
    body: "Third-party ads (including Google AdSense) may appear. We are not responsible for advertiser content. Click ads at your own discretion.",
  },
  {
    heading: "5. Limitation of liability",
    body: "We are not liable for missed rewards, incorrect timers, lost in-game progress, or any indirect damages from using this site.",
  },
  {
    heading: "6. Changes",
    body: "We may update these terms. Continued use after changes constitutes acceptance.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">

      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Terms of Use
      </h1>
      <p className="mt-3 text-xs text-white/30 font-[family-name:var(--font-ibm-plex)] uppercase tracking-widest">
        Last updated: June 2026
      </p>
      <p className="mt-6 text-sm leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
        By using TheGameBit (thegamebit.online), you agree to these terms. If
        you disagree, please do not use the site.
      </p>

      {SECTIONS.map(({ heading, body }) => (
        <section key={heading} className="mt-10 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
            {heading}
          </h2>
          <p className="text-sm leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
            {body}
          </p>
        </section>
      ))}

      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          7. Contact
        </h2>
        <p className="text-sm leading-relaxed text-white/60 font-[family-name:var(--font-ibm-plex)]">
          Questions: visit our{" "}
          <Link
            href="/contact"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            contact page
          </Link>{" "}
          or email us at{" "}
          <a
            href="mailto:contact@thegamebit.online"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            contact@thegamebit.online
          </a>
          .
        </p>
      </section>

      <div className="mt-12">
        <Link
          href="/"
          className="text-sm text-white/30 hover:text-white transition-colors font-[family-name:var(--font-ibm-plex)]"
        >
          ← Back to home
        </Link>
      </div>

    </main>
  );
}

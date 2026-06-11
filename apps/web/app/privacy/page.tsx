// apps/web/app/(support)/privacy/page.tsx

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TheGameBit",
  description:
    "Privacy Policy for TheGameBit including Google AdSense, cookies, and your data rights.",
  alternates: { canonical: "https://thegamebit.online/privacy" },
};

const EXTERNAL_LINKS = [
  {
    href: "https://policies.google.com/technologies/ads",
    label: "How Google uses information from sites that use its services",
  },
  {
    href: "https://policies.google.com/privacy",
    label: "Google Privacy Policy",
  },
  {
    href: "https://www.google.com/settings/ads",
    label: "Google Ads Settings — opt out of personalized advertising",
  },
  {
    href: "https://optout.aboutads.info/",
    label: "NAI opt-out (US)",
  },
  {
    href: "https://www.youronlinechoices.eu/",
    label: "Your Online Choices (EU)",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">

      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Privacy Policy
      </h1>
      <p className="mt-3 text-xs text-white/30 font-[family-name:var(--font-ibm-plex)] uppercase tracking-widest">
        Last updated: June 2026 · Applies to thegamebit.online
      </p>
      <p className="mt-6 text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
        TheGameBit ("we", "us") respects your privacy. This policy explains what
        information we collect, how we use it, and your choices — especially
        regarding advertising cookies used by Google AdSense.
      </p>

      {/* Information we collect */}
      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Information we collect
        </h2>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          <strong className="text-white/80">Information you provide:</strong>{" "}
          If you email us via the{" "}
          <Link href="/contact" className="text-orange-400 hover:text-orange-300 transition-colors">
            contact page
          </Link>
          , we receive your email address and message content.
        </p>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          <strong className="text-white/80">Information stored locally on your device:</strong>{" "}
          Season date preferences, daily check-in streaks, card likes, and
          cookie consent choices are stored in your browser (localStorage /
          sessionStorage). We do not transmit this to our servers because we do
          not operate a login system or backend database for these features.
        </p>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          <strong className="text-white/80">Automatically collected information:</strong>{" "}
          When ads are enabled and you consent, Google and its partners may
          collect device identifiers, IP address, browser type, pages visited,
          and ad interaction data through cookies and similar technologies.
        </p>
      </section>

      {/* How we use information */}
      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          How we use information
        </h2>
        <ul className="space-y-2 text-sm text-white/60 font-[family-name:var(--font-ibm-plex)]">
          {[
            "Operate countdown timers and remember your preferences",
            "Respond to contact emails",
            "Display and measure advertisements (with consent)",
            "Improve site content and fix reported date errors",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Google AdSense */}
      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Google AdSense & third-party advertising
        </h2>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          We use <strong className="text-white/80">Google AdSense</strong>{" "}
          (Google LLC) to show ads. Google uses cookies to serve ads based on
          your visits to this and other websites. Google's use of advertising
          cookies enables it and its partners to serve ads to you.
        </p>
        <ul className="space-y-2 text-sm font-[family-name:var(--font-ibm-plex)]">
          {EXTERNAL_LINKS.map((link) => (
            <li key={link.href} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          Publisher ID:{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/70">
            ca-pub-4190145625443935
          </code>
          . Ad inventory is listed in our{" "}
          <a href="/ads.txt" className="text-orange-400 hover:text-orange-300 transition-colors">
            ads.txt
          </a>{" "}
          file.
        </p>
      </section>

      {/* Cookies */}
      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Cookies
        </h2>
        <ul className="space-y-2 text-sm text-white/60 font-[family-name:var(--font-ibm-plex)]">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
            <span>
              <strong className="text-white/80">Essential local storage</strong>{" "}
              — timer settings and streaks (no cross-site tracking)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
            <span>
              <strong className="text-white/80">Consent cookie</strong> —
              remembers your ad cookie choice (
              <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-white/70">
                gameBitCookieConsent
              </code>
              )
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400/60" />
            <span>
              <strong className="text-white/80">Advertising cookies</strong> —
              set by Google when you accept ads (only after AdSense is active
              and you consent)
            </span>
          </li>
        </ul>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          You can decline non-essential ad cookies via our cookie banner or
          block cookies in your browser settings.
        </p>
      </section>

      {/* Remaining sections */}
      {[
        {
          heading: "Data retention",
          body: "Local browser data remains until you clear site data. Emails are kept only as long as needed to respond and resolve inquiries.",
        },
        {
          heading: "Children's privacy",
          body: "This site is not directed at children under 13. We do not knowingly collect personal information from children. Contact us if you believe a child has provided personal data.",
        },
        {
          heading: "Your rights (EEA/UK)",
          body: "Depending on your location, you may have rights to access, correct, delete, or restrict processing of personal data. Contact us to exercise these rights.",
        },
        {
          heading: "Changes",
          body: 'We may update this policy. The "Last updated" date will change when we do.',
        },
      ].map(({ heading, body }) => (
        <section key={heading} className="mt-10 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
            {heading}
          </h2>
          <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
            {body}
          </p>
        </section>
      ))}

      {/* Contact */}
      <section className="mt-10 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-ibm-plex)]">
          Contact
        </h2>
        <p className="text-sm text-white/60 font-[family-name:var(--font-ibm-plex)] leading-relaxed">
          Privacy questions:{" "}
          <a
            href="mailto:contact@thegamebit.online"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            contact@thegamebit.online
          </a>{" "}
          or our{" "}
          <Link href="/contact" className="text-orange-400 hover:text-orange-300 transition-colors">
            contact page
          </Link>
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

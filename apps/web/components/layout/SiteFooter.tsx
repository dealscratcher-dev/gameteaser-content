// apps/web/components/layout/SiteFooter.tsx

import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  heading: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: "twitter" | "discord" | "youtube" | "instagram" | "twitch";
  href: string;
  label: string;
}

export interface SiteFooterProps {
  /** Column sections for the link grid */
  sections?: FooterSection[];
  /** Social media links */
  socials?: SocialLink[];
  /** Copyright holder name */
  companyName?: string;
  /** Year override (defaults to current year) */
  year?: number;
  /** Legal disclaimer or tagline */
  legalNote?: string;
  /** Skeleton / loading state */
  loading?: boolean;
  className?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    heading: "Discover",
    links: [
      { label: "Games", href: "/games" },
      { label: "Anime", href: "/anime" },
      { label: "Comics", href: "/comics" },
      { label: "Movies", href: "/movies" },
      { label: "Universe", href: "/universe" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Fan Hubs", href: "/community/hubs" },
      { label: "Characters", href: "/characters" },
      { label: "Releases", href: "/releases" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Press Kit", href: "/press", external: true },
      { label: "Advertise", href: "/advertise" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Cookie Settings", href: "/cookies" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

// const DEFAULT_SOCIALS: SocialLink[] = [
//   { platform: "twitter", href: "https://twitter.com/thegamebit", label: "Follow us on Twitter / X" },
//   { platform: "discord", href: "https://discord.gg/thegamebit", label: "Join our Discord" },
//   { platform: "youtube", href: "https://youtube.com/@thegamebit", label: "Subscribe on YouTube" },
//   { platform: "twitch", href: "https://twitch.tv/thegamebit", label: "Watch on Twitch" },
// ];
const DEFAULT_SOCIALS: SocialLink[] = [];

// ─── Social Icons ─────────────────────────────────────────────────────────────

function SocialIcon({ platform }: { platform: SocialLink["platform"] }) {
  switch (platform) {
    case "twitter":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M11.9 8.7 18.7 1h-1.6L11.2 7.7 6.3 1H1l7.1 10.3L1 19h1.6l6.2-7.2 5 7.2H19L11.9 8.7Zm-2.2 2.6-.7-1.1L2.7 2.2h2.5L10 8l.7 1.1 6.1 8.7h-2.5l-4.6-6.5Z" />
        </svg>
      );
    case "discord":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M16.93 4A15.84 15.84 0 0 0 13 3a.06.06 0 0 0-.06.03c-.15.28-.32.64-.44.93a14.6 14.6 0 0 0-4.99 0 9.33 9.33 0 0 0-.45-.93A.06.06 0 0 0 7 3a15.8 15.8 0 0 0-3.93 1C.44 7.37-.27 10.65.08 13.88c.01.07.06.14.12.18A15.93 15.93 0 0 0 5 15.63a.06.06 0 0 0 .07-.02 11.43 11.43 0 0 0 .98-1.6.06.06 0 0 0-.03-.08 10.5 10.5 0 0 1-1.5-.71.06.06 0 0 1-.01-.1c.1-.08.2-.16.3-.23a.06.06 0 0 1 .07-.01c3.15 1.44 6.56 1.44 9.67 0a.06.06 0 0 1 .07.01c.1.08.2.15.3.23.04.03.03.1-.01.1-.48.28-.98.52-1.5.72a.06.06 0 0 0-.04.08c.29.56.62 1.1.98 1.6a.06.06 0 0 0 .07.01 15.88 15.88 0 0 0 4.8-2.57.06.06 0 0 0 .03-.09c.4-4.13-.68-7.38-2.87-10.43ZM6.68 11.9c-1.08 0-1.96-.98-1.96-2.2s.87-2.2 1.96-2.2c1.1 0 1.98.99 1.96 2.2 0 1.22-.87 2.2-1.96 2.2Zm7.24 0c-1.08 0-1.96-.98-1.96-2.2s.87-2.2 1.96-2.2c1.1 0 1.97.99 1.96 2.2 0 1.22-.86 2.2-1.96 2.2Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M18.96 6s-.2-1.4-.8-2.01c-.77-.8-1.63-.81-2.02-.86C13.68 3 10 3 10 3s-3.68 0-6.14.13c-.4.05-1.25.06-2.02.86C1.24 4.6 1.04 6 1.04 6S.84 7.62.84 9.25v1.52c0 1.62.2 3.25.2 3.25s.2 1.4.8 2.01c.77.8 1.78.78 2.23.86C5.2 17 10 17 10 17s3.68 0 6.14-.13c.4-.05 1.25-.06 2.02-.86.6-.61.8-2.01.8-2.01s.2-1.63.2-3.25V9.25C19.16 7.62 18.96 6 18.96 6ZM8.12 12.75V7.25l5.5 2.76-5.5 2.74Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M10 2c2.17 0 2.44.01 3.3.05 2.24.1 3.28 1.16 3.38 3.38.04.86.05 1.12.05 3.3s-.01 2.44-.05 3.3c-.1 2.21-1.13 3.28-3.38 3.38-.86.04-1.12.05-3.3.05s-2.44-.01-3.3-.05c-2.24-.1-3.28-1.17-3.38-3.38C3.28 12.17 3.27 11.9 3.27 10c0-2.17.01-2.44.05-3.3.1-2.22 1.15-3.28 3.38-3.38C7.56 2.27 7.83 2 10 2Zm0 1.44c-2.14 0-2.38.01-3.22.05-1.54.07-2.25.79-2.32 2.32C4.42 6.62 4.4 6.86 4.4 10c0 2.14.01 2.39.05 3.22.07 1.52.77 2.25 2.32 2.32.84.04 1.07.05 3.22.05s2.38-.01 3.22-.05c1.54-.07 2.25-.8 2.32-2.32.04-.83.05-1.08.05-3.22s-.01-2.38-.05-3.22c-.07-1.53-.78-2.25-2.32-2.32-.84-.04-1.08-.05-3.22-.05Zm0 2.44a4.12 4.12 0 1 1 0 8.24 4.12 4.12 0 0 1 0-8.24Zm0 1.45a2.67 2.67 0 1 0 0 5.34 2.67 2.67 0 0 0 0-5.34Zm4.27-2.57a.96.96 0 1 1 0 1.93.96.96 0 0 1 0-1.93Z" />
        </svg>
      );
    case "twitch":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M2.5 1 1 4.5V17h4v2.5h2.5L10 17h3l5-5V1H2.5Zm14 10-2.5 2.5H10l-2 2v-2H4.5V2.5h12V11Z" />
          <path d="M14.5 5.5h-1.5v4h1.5v-4ZM10.5 5.5H9v4h1.5v-4Z" />
        </svg>
      );
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SiteFooterSkeleton() {
  return (
    <footer
      aria-busy="true"
      aria-label="Loading site footer"
      className="border-t border-white/[0.06] bg-zinc-950 py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="space-y-3">
              <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 w-24 rounded bg-white/6 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Site-wide footer for TheGameBit.
 *
 * Features:
 * - Responsive link grid (2 cols → 4 cols)
 * - Brand mark with tagline
 * - Social icon row
 * - Legal note + copyright bar
 * - Skeleton loading state
 * - Fully accessible (landmark, external link indicators)
 */
export default function SiteFooter({
  sections = DEFAULT_SECTIONS,
  socials = DEFAULT_SOCIALS,
  companyName = "TheGameBit",
  year,
  legalNote,
  loading = false,
  className,
}: SiteFooterProps) {
  const currentYear = year ?? new Date().getFullYear();

  if (loading) return <SiteFooterSkeleton />;

  return (
    <footer
      aria-label="Site footer"
      className={cn(
        "relative border-t border-white/[0.06] bg-zinc-950",
        className
      )}
    >
      {/* Subtle top glow */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* ── Top row: brand + socials ── */}
        <div className="mb-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">

          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label={`${companyName} — go to homepage`}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 rounded-sm"
            >
              <span
                className="
                  font-[family-name:var(--font-barlow-condensed)]
                  text-2xl font-extrabold uppercase tracking-tight leading-none
                "
                aria-label={companyName}
              >
                <span className="text-white/30 text-xl">The</span>
                <span className="text-white">Game</span>
                <span className="text-orange-400">Bit</span>
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/30 font-[family-name:var(--font-ibm-plex)]">
              The ultimate fandom discovery platform for games, anime, comics, and beyond.
            </p>
          </div>

          {/* Socials — commented out until social accounts are ready */}
          {/* {socials.length > 0 && (
            <div className="flex items-center gap-2" aria-label="Social media links">
              {socials.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="
                    flex h-9 w-9 items-center justify-center rounded-full
                    border border-white/10 text-white/40
                    transition-all duration-200
                    hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/10
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
                  "
                >
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          )} */}
        </div>

        {/* ── Link grid ── */}
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2
                className="
                  mb-4 text-[10px] font-bold uppercase tracking-[0.2em]
                  text-white/30 font-[family-name:var(--font-ibm-plex)]
                "
              >
                {section.heading}
              </h2>
              <ul className="space-y-2.5" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center gap-1
                          text-sm text-white/45 font-[family-name:var(--font-ibm-plex)]
                          transition-colors hover:text-white
                          focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 rounded-sm
                        "
                      >
                        {link.label}
                        <svg
                          viewBox="0 0 10 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          aria-label="(opens in new tab)"
                          className="h-2.5 w-2.5 opacity-50"
                        >
                          <path d="M4 2H2v6h6V6M6 2h2v2M8 2 5 5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="
                          text-sm text-white/45 font-[family-name:var(--font-ibm-plex)]
                          transition-colors hover:text-white
                          focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 rounded-sm
                        "
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-start gap-2 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/25 font-[family-name:var(--font-ibm-plex)]">
            © {currentYear} {companyName}. All rights reserved.
          </p>
          {legalNote && (
            <p
              className="text-xs text-white/20 font-[family-name:var(--font-ibm-plex)] sm:text-right"
              dangerouslySetInnerHTML={{ __html: legalNote }}
            />
          )}
        </div>
      </div>
    </footer>
  );
}

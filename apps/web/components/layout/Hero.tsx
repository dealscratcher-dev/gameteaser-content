// apps/web/components/layout/Hero.tsx

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeroTag {
  emoji: string;
  label: string;
  variant?: "codm" | "pubg" | "anime" | "comicon" | "default";
}

export interface HeroProps {
  /** Primary headline — supports a <span> break via `highlight` */
  title: string;
  highlight?: string;
  kicker?: string;
  note?: string;
  tags?: HeroTag[];
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Skeleton / loading state */
  loading?: boolean;
  className?: string;
}

// ─── Tag variant map ──────────────────────────────────────────────────────────

const TAG_VARIANTS: Record<NonNullable<HeroTag["variant"]>, string> = {
  codm:    "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30",
  pubg:    "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30",
  anime:   "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30",
  comicon: "bg-cyan-500/20   text-cyan-300   ring-1 ring-cyan-500/30",
  default: "bg-white/10      text-white/80   ring-1 ring-white/15",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading hero"
      className="relative isolate min-h-[520px] md:min-h-[640px] overflow-hidden bg-zinc-900"
    >
      {/* grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-transparent" />
      <div className="relative z-20 flex h-full flex-col justify-end px-6 pb-14 md:px-16 md:pb-20 max-w-5xl mx-auto pt-32">
        <div className="h-4 w-28 rounded bg-white/10 animate-pulse mb-4" />
        <div className="h-10 w-3/4 rounded bg-white/10 animate-pulse mb-3" />
        <div className="h-10 w-1/2 rounded bg-white/10 animate-pulse mb-8" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-36 rounded-full bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hero({
  title,
  highlight,
  kicker = "games · anime · comic-cons",
  note,
  tags = [],
  imageSrc = "/assets/hero-banner.png",
  imageAlt = "Tactical operators showdown",
  ctaLabel,
  ctaHref,
  loading = false,
  className,
}: HeroProps) {
  if (loading) return <HeroSkeleton />;

  return (
    <section
      aria-label="Season Rush banner"
      className={cn(
        "relative isolate min-h-[520px] md:min-h-[640px] overflow-hidden",
        className
      )}
    >
      {/* ── Grain overlay ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Background image ── */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        fetchPriority="high"
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* ── Gradient shade — bottom-up like the original ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/10"
      />
      {/* Side vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950/60 via-transparent to-zinc-950/30"
      />

      {/* ── Content ── */}
      <div className="relative z-20 flex h-full flex-col justify-end px-6 pb-14 pt-32 md:px-16 md:pb-20 max-w-5xl mx-auto">

        {/* Kicker */}
        {kicker && (
          <p
            className="
              mb-3 text-xs font-semibold uppercase tracking-[0.25em]
              text-white/50 font-[family-name:var(--font-ibm-plex)]
            "
          >
            {kicker}
          </p>
        )}

        {/* Headline — Barlow Condensed, like the original */}
        <h1
          className="
            font-[family-name:var(--font-barlow-condensed)]
            text-4xl font-extrabold uppercase leading-[0.95] tracking-tight
            text-white
            sm:text-6xl md:text-7xl
            [text-shadow:0_2px_24px_rgba(0,0,0,0.6)]
            mb-5
          "
        >
          {title}
          {highlight && (
            <>
              <br />
              <span className="text-orange-400">{highlight}</span>
            </>
          )}
        </h1>

        {/* Tags row */}
        {tags.length > 0 && (
          <ul
            aria-label="Content categories"
            className="mb-5 flex flex-wrap gap-2"
          >
            {tags.map((tag) => (
              <li key={tag.label}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
                    "text-xs font-semibold font-[family-name:var(--font-ibm-plex)]",
                    "backdrop-blur-sm transition-colors",
                    TAG_VARIANTS[tag.variant ?? "default"]
                  )}
                >
                  <span aria-hidden="true">{tag.emoji}</span>
                  {tag.label}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA button */}
        {ctaLabel && ctaHref && (
          <div className="mb-5">
            <Link
              href={ctaHref}
              className="
                inline-flex items-center gap-2
                rounded-none border border-orange-500 bg-orange-500
                px-6 py-2.5
                font-[family-name:var(--font-barlow-condensed)]
                text-sm font-bold uppercase tracking-widest text-zinc-950
                transition-all
                hover:bg-transparent hover:text-orange-400
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400
                active:scale-95
              "
            >
              {ctaLabel}
            </Link>
          </div>
        )}

        {/* Fan-hub note */}
        {note && (
          <p
            className="
              text-xs text-white/40
              font-[family-name:var(--font-ibm-plex)]
            "
            dangerouslySetInnerHTML={{ __html: note }}
          />
        )}
      </div>
    </section>
  );
}

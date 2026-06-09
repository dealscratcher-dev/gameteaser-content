"use client";

/**
 * AdSlot.tsx
 * Lazy-loading ad slot for TheGameBit.
 * Renders a placeholder that only materialises its ad when in the viewport
 * (IntersectionObserver-gated). Supports sponsor cards, banners, and
 * sidebar formats. Falls back gracefully when no ad is available.
 *
 * Usage:
 *   <AdSlot format="banner" slotId="hp-top-banner" />
 *   <AdSlot format="sidebar" slotId="discover-sidebar-1" sponsor={sponsorData} />
 */

import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdFormat = "banner" | "sidebar" | "card" | "leaderboard";

/** A first-party sponsored listing — shown instead of a 3rd-party ad. */
export interface SponsorData {
  /** Sponsor display name */
  name: string;
  /** Main creative image */
  imageUrl: string;
  /** Short headline (≤ 60 chars) */
  headline: string;
  /** Sub-copy (≤ 120 chars) */
  body?: string;
  /** Destination URL */
  href: string;
  /** CTA button label (default: "Learn More") */
  cta?: string;
  /** Optional badge (e.g. "Presented by") */
  badge?: string;
}

export interface AdSlotProps {
  /** Unique ad slot identifier — used for analytics / ad-server calls */
  slotId: string;
  /** Ad format determines dimensions and layout */
  format?: AdFormat;
  /** Provide first-party sponsor data to bypass the ad network */
  sponsor?: SponsorData;
  /** Custom className override for the outer wrapper */
  className?: string;
  /** Callback fired when the slot becomes visible */
  onView?: (slotId: string) => void;
  /** Callback fired on CTA click */
  onClick?: (slotId: string) => void;
  /** Show a "close" button to dismiss (useful for banners) */
  dismissible?: boolean;
}

// ─── Dimension map ────────────────────────────────────────────────────────────

const formatDimensions: Record<
  AdFormat,
  { width: string; height: string; minH: string }
> = {
  banner: { width: "w-full", height: "h-24 sm:h-28", minH: "min-h-[96px]" },
  sidebar: { width: "w-full", height: "h-60", minH: "min-h-[240px]" },
  card: { width: "w-full max-w-sm", height: "h-48", minH: "min-h-[192px]" },
  leaderboard: {
    width: "w-full",
    height: "h-24 sm:h-20",
    minH: "min-h-[80px]",
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdSkeleton({ format }: { format: AdFormat }) {
  const dim = formatDimensions[format];
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse rounded-xl",
        dim.width,
        dim.height,
        dim.minH,
        "bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03]",
        "bg-[length:200%_100%]",
      ].join(" ")}
      style={{
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite linear, pulse 2s infinite",
      }}
    />
  );
}

// ─── Sponsor Card ─────────────────────────────────────────────────────────────

function SponsorCard({
  sponsor,
  format,
  slotId,
  onClick,
}: {
  sponsor: SponsorData;
  format: AdFormat;
  slotId: string;
  onClick?: (id: string) => void;
}) {
  const isHorizontal = format === "banner" || format === "leaderboard";

  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Sponsored: ${sponsor.headline}`}
      onClick={() => onClick?.(slotId)}
      className={[
        "group relative flex overflow-hidden rounded-xl border border-white/[0.07]",
        "bg-gradient-to-br from-zinc-900 to-zinc-950",
        "ring-1 ring-inset ring-white/[0.04] transition-all duration-300",
        "hover:border-orange-500/30 hover:ring-orange-500/10 hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]",
        isHorizontal ? "flex-row items-center gap-4 p-3" : "flex-col",
        formatDimensions[format].width,
        formatDimensions[format].minH,
      ].join(" ")}
    >
      {/* Image */}
      <div
        className={[
          "shrink-0 overflow-hidden",
          isHorizontal ? "h-16 w-24 rounded-lg" : "h-36 w-full",
        ].join(" ")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sponsor.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text */}
      <div className={["min-w-0 flex-1", isHorizontal ? "" : "p-3"].join(" ")}>
        {sponsor.badge && (
          <span className="mb-1 inline-block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {sponsor.badge}
          </span>
        )}
        <p className="truncate text-sm font-semibold text-slate-100">
          {sponsor.headline}
        </p>
        {sponsor.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
            {sponsor.body}
          </p>
        )}
        <span
          aria-hidden="true"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400
                     transition-colors group-hover:text-orange-300"
        >
          {sponsor.cta ?? "Learn More"}
          <svg
            viewBox="0 0 12 12"
            width={10}
            height={10}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6h7M6.5 3l3 3-3 3" />
          </svg>
        </span>
      </div>

      {/* Sponsored label */}
      <span
        aria-label="Sponsored content"
        className="absolute right-2 top-2 rounded-sm bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold
                   uppercase tracking-widest text-slate-600"
      >
        Ad
      </span>
    </a>
  );
}

// ─── Fallback empty state ─────────────────────────────────────────────────────

function EmptySlot({ format }: { format: AdFormat }) {
  const dim = formatDimensions[format];
  return (
    <div
      aria-hidden="true"
      className={[
        "flex items-center justify-center rounded-xl border border-dashed border-white/[0.05]",
        dim.width,
        dim.height,
        dim.minH,
      ].join(" ")}
    >
      <span className="text-[10px] font-medium uppercase tracking-widest text-white/10">
        Advertisement
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * AdSlot — lazy-hydrates ad content only when the slot enters the viewport.
 * Designed to be wrapped by an ads provider component that injects `sponsor`.
 */
export function AdSlot({
  slotId,
  format = "banner",
  sponsor,
  className,
  onView,
  onClick,
  dismissible = false,
}: AdSlotProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver gate
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onView?.(slotId);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [slotId, onView]);

  if (dismissed) return null;

  return (
    <div
      ref={wrapperRef}
      className={[
        "relative",
        formatDimensions[format].width,
        className ?? "",
      ].join(" ")}
    >
      {!visible ? (
        <AdSkeleton format={format} />
      ) : sponsor ? (
        <SponsorCard
          sponsor={sponsor}
          format={format}
          slotId={slotId}
          onClick={onClick}
        />
      ) : (
        <EmptySlot format={format} />
      )}

      {dismissible && visible && (
        <button
          aria-label="Close advertisement"
          onClick={() => setDismissed(true)}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full
                     border border-white/10 bg-zinc-950 text-slate-500 transition-colors
                     hover:border-white/20 hover:text-slate-300 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <svg
            viewBox="0 0 12 12"
            width={8}
            height={8}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2.22 2.22a.75.75 0 011.06 0L6 4.94l2.72-2.72a.75.75 0 111.06 1.06L7.06 6l2.72 2.72a.75.75 0 11-1.06 1.06L6 7.06 3.28 9.78a.75.75 0 01-1.06-1.06L4.94 6 2.22 3.28a.75.75 0 010-1.06z" />
          </svg>
        </button>
      )}
    </div>
  );
}

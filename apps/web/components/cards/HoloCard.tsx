// apps/web/components/cards/HoloCard.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HoloRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type HoloCardVariant =
  | "character"
  | "universe"
  | "release"
  | "event"
  | "collection";

export interface HoloCardProps {
  /** Unique slug, used to construct the href */
  slug: string;
  /** Card headline */
  title: string;
  /** Secondary descriptor below the title */
  subtitle?: string;
  /** Small eyebrow label above the title (e.g. "Season 3 · Chapter 2") */
  eyebrow?: string;
  /** Card face image */
  image: string;
  imageAlt?: string;
  /** Destination href — overrides auto-generated `/${variant}/${slug}` */
  href?: string;
  /** Controls holographic shimmer palette and badge label */
  rarity?: HoloRarity;
  /** Category stamp in the top-right corner */
  variant?: HoloCardVariant;
  /** Optional genre/tag chips on the card face */
  tags?: string[];
  /** Like state — controlled from parent */
  liked?: boolean;
  likeCount?: number;
  onLike?: (slug: string) => void;
  /** Bookmark state */
  bookmarked?: boolean;
  onBookmark?: (slug: string) => void;
  /** Numeric rank badge in the top-left corner (e.g. for ranked lists) */
  rank?: number;
  /** True = show new-release indicator dot */
  isNew?: boolean;
  /** Disable the tilt effect (e.g. in low-motion contexts) */
  disableTilt?: boolean;
  loading?: boolean;
  className?: string;
}

// ─── Rarity Palette ───────────────────────────────────────────────────────────

export const RARITY_PALETTE: Record<
  HoloRarity,
  {
    label: string;
    /** Primary accent color (hex / oklch) */
    accent: string;
    /** Holo shimmer stops — at least 4 */
    shimmer: string[];
    /** Badge classes */
    badge: string;
    /** Border ring while hovered */
    ring: string;
  }
> = {
  common: {
    label: "Common",
    accent: "#a1a1aa",
    shimmer: ["#a1a1aa33", "#71717a22", "#a1a1aa44", "#52525211"],
    badge: "text-zinc-400 border-zinc-600 bg-zinc-900/70",
    ring: "ring-zinc-500/40",
  },
  rare: {
    label: "Rare",
    accent: "#60a5fa",
    shimmer: ["#60a5fa44", "#3b82f633", "#93c5fd55", "#1d4ed822"],
    badge: "text-blue-300 border-blue-600 bg-blue-950/70",
    ring: "ring-blue-500/50",
  },
  epic: {
    label: "Epic",
    accent: "#a78bfa",
    shimmer: ["#a78bfa44", "#7c3aed33", "#c4b5fd55", "#4c1d9522"],
    badge: "text-purple-300 border-purple-600 bg-purple-950/70",
    ring: "ring-purple-500/50",
  },
  legendary: {
    label: "Legendary",
    accent: "#fb923c",
    shimmer: ["#fb923c55", "#f9731644", "#fcd34d44", "#92400e22"],
    badge: "text-orange-300 border-orange-500 bg-orange-950/70",
    ring: "ring-orange-500/60",
  },
  mythic: {
    label: "Mythic",
    accent: "#f43f5e",
    shimmer: ["#f43f5e55", "#e11d4844", "#fb7185aa", "#fbbf2444"],
    badge:
      "text-rose-200 border-rose-400 bg-rose-950/70 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    ring: "ring-rose-500/70",
  },
};

// ─── Variant stamp ─────────────────────────────────────────────────────────────

const VARIANT_STAMP: Record<HoloCardVariant, { label: string; classes: string }> =
  {
    character:  { label: "Character",  classes: "bg-orange-500  text-zinc-950" },
    universe:   { label: "Universe",   classes: "bg-cyan-400    text-zinc-950" },
    release:    { label: "Release",    classes: "bg-yellow-400  text-zinc-950" },
    event:      { label: "Event",      classes: "bg-rose-500    text-white"    },
    collection: { label: "Collection", classes: "bg-purple-500  text-white"    },
  };

// ─── Inline Icons ─────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.344l1.172-1.172a4 4 0 115.656 5.656l-6.828 6.829-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V4z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * HoloCard — the flagship trading-card-style component for TheGameBit.
 *
 * A portrait-oriented card that combines:
 * - CSS 3-D perspective tilt following the cursor
 * - Rarity-driven holographic shimmer (radial + linear prismatic layers)
 * - Animated foil edge on legendary / mythic rarities
 * - Controlled like / bookmark actions
 * - New-release indicator dot
 * - Rank badge for ranked list contexts
 * - Full keyboard + ARIA accessibility
 * - Skeleton loading state (see HoloCardSkeleton)
 */
export default function HoloCard({
  slug,
  title,
  subtitle,
  eyebrow,
  image,
  imageAlt,
  href,
  rarity = "common",
  variant,
  tags = [],
  liked = false,
  likeCount,
  onLike,
  bookmarked = false,
  onBookmark,
  rank,
  isNew = false,
  disableTilt = false,
  loading = false,
  className,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const palette = RARITY_PALETTE[rarity];
  const stamp = variant ? VARIANT_STAMP[variant] : null;
  const destination = href ?? `/${variant ?? "card"}/${slug}`;

  // ── Tilt + shimmer state ──────────────────────────────────────────────────
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disableTilt || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width;  // 0→1
      const cy = (e.clientY - rect.top) / rect.height;  // 0→1
      // tilt: ±12deg
      setTilt({ x: (cy - 0.5) * -14, y: (cx - 0.5) * 14 });
      setShine({ x: cx * 100, y: cy * 100 });
    },
    [disableTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  }, []);

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (likeAnimating) return;
    setLikeAnimating(true);
    onLike?.(slug);
    setTimeout(() => setLikeAnimating(false), 500);
  }

  function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onBookmark?.(slug);
  }

  // ── Import skeleton via local component ─────────────────────────────────
  if (loading) {
    return <HoloCardSkeletonInline rarity={rarity} className={className} />;
  }

  const isFoil = rarity === "legendary" || rarity === "mythic";

  return (
    <div
      ref={cardRef}
      className={cn("relative w-full", className)}
      style={{ perspective: "800px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <article
        aria-label={`${title}${subtitle ? ` — ${subtitle}` : ""}`}
        className={cn(
          // Layout
          "relative isolate overflow-hidden rounded-sm aspect-[2/3] w-full",
          // Border
          "ring-1 ring-white/10",
          hovered && palette.ring,
          // Lift shadow
          "transition-shadow duration-300",
          hovered && "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)]"
        )}
        style={{
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.03,1.03,1.03)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
          transition: hovered
            ? "transform 0.08s linear"
            : "transform 0.45s cubic-bezier(0.23,1,0.32,1)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* ── Card face image ── */}
        <Link
          href={destination}
          aria-label={`Open ${title}`}
          tabIndex={0}
          className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <Image
            src={image}
            alt={imageAlt ?? `${title} card art`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={rank != null && rank <= 3}
            className={cn(
              "object-cover object-top transition-transform duration-700",
              hovered && "scale-[1.06]"
            )}
          />
        </Link>

        {/* ── Holographic shimmer — rarity-tinted radial ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `
              radial-gradient(ellipse at ${shine.x}% ${shine.y}%, ${palette.shimmer[0]} 0%, transparent 55%),
              radial-gradient(ellipse at ${100 - shine.x}% ${100 - shine.y}%, ${palette.shimmer[1]} 0%, transparent 60%)
            `,
            mixBlendMode: "color-dodge",
          }}
        />

        {/* ── Prismatic rainbow foil — legendary / mythic only ── */}
        {isFoil && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              opacity: hovered ? 0.18 : 0,
              backgroundImage: `
                linear-gradient(
                  ${115 + tilt.y * 2}deg,
                  transparent 20%,
                  ${palette.shimmer[2]} 30%,
                  ${palette.shimmer[0]} 40%,
                  transparent 45%,
                  ${palette.shimmer[3]} 55%,
                  ${palette.shimmer[1]} 65%,
                  transparent 70%
                )
              `,
              mixBlendMode: "color-dodge",
            }}
          />
        )}

        {/* ── Specular highlight (moving glint) ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            opacity: hovered ? 0.12 : 0,
            transition: "opacity 0.3s",
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.9), transparent 35%)`,
            mixBlendMode: "overlay",
          }}
        />

        {/* ── Gradient shade — bottom dark veil ── */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 bg-gradient-to-t from-zinc-950/95 via-zinc-950/30 to-transparent"
        />
        {/* Side vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 bg-gradient-to-r from-zinc-950/30 via-transparent to-zinc-950/20"
        />

        {/* ── Top-left: rank badge ── */}
        {rank != null && (
          <div
            aria-label={`Ranked #${rank}`}
            className="absolute left-2.5 top-2.5 z-30 flex h-7 w-7 items-center justify-center"
          >
            <span
              className="
                absolute inset-0 rounded-none
                border border-white/20 bg-zinc-950/80 backdrop-blur-sm
              "
              aria-hidden="true"
            />
            <span
              className="
                relative font-[family-name:var(--font-barlow-condensed)]
                text-xs font-extrabold text-white leading-none
              "
            >
              {rank}
            </span>
          </div>
        )}

        {/* ── Top-left: new dot (when no rank) ── */}
        {isNew && rank == null && (
          <div className="absolute left-3 top-3 z-30 flex items-center gap-1.5">
            <span
              aria-label="New"
              className="relative flex h-2 w-2"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400 font-[family-name:var(--font-barlow-condensed)]">
              New
            </span>
          </div>
        )}

        {/* ── Top-right: rarity badge ── */}
        <div className="absolute right-2.5 top-2.5 z-30 flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "inline-block rounded-none border px-1.5 py-0.5 backdrop-blur-sm",
              "font-[family-name:var(--font-barlow-condensed)]",
              "text-[9px] font-bold uppercase tracking-[0.15em]",
              palette.badge
            )}
          >
            {palette.label}
          </span>

          {/* Variant stamp below rarity */}
          {stamp && (
            <span
              className={cn(
                "inline-block rounded-none px-2 py-0.5",
                "font-[family-name:var(--font-barlow-condensed)]",
                "text-[9px] font-bold uppercase tracking-[0.12em]",
                stamp.classes
              )}
            >
              {stamp.label}
            </span>
          )}
        </div>

        {/* ── Bottom content ── */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-3">
          {/* Eyebrow */}
          {eyebrow && (
            <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-ibm-plex)]">
              {eyebrow}
            </p>
          )}

          {/* Title */}
          <h3 className="
            font-[family-name:var(--font-barlow-condensed)]
            text-xl font-extrabold uppercase leading-none tracking-tight text-white
            [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]
            mb-0.5
          ">
            {title}
          </h3>

          {/* Subtitle */}
          {subtitle && (
            <p className="mb-2 text-[11px] italic text-white/50 font-[family-name:var(--font-ibm-plex)]">
              {subtitle}
            </p>
          )}

          {/* Tag chips */}
          {tags.length > 0 && (
            <ul aria-label="Tags" className="mb-2.5 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <li key={tag}>
                  <span className="
                    inline-block rounded-full bg-white/10 px-2 py-0.5 backdrop-blur-sm
                    text-[9px] font-medium uppercase tracking-wider text-white/55
                    font-[family-name:var(--font-ibm-plex)]
                  ">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Action row */}
          <div className="flex gap-1.5">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              aria-pressed={liked}
              aria-label={liked ? `Unlike ${title}` : `Like ${title}`}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-none border px-2 py-1.5",
                "font-[family-name:var(--font-barlow-condensed)]",
                "text-[10px] font-bold uppercase tracking-widest",
                "transition-all duration-200",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 focus-visible:outline-offset-1",
                liked
                  ? "border-orange-500 bg-orange-500/20 text-orange-400"
                  : "border-white/20 bg-white/5 text-white/55 hover:border-orange-500/50 hover:text-orange-400",
                likeAnimating && "scale-95"
              )}
            >
              <HeartIcon filled={liked} />
              <span>{likeCount != null ? likeCount : "Like"}</span>
            </button>

            {/* Bookmark */}
            <button
              type="button"
              onClick={handleBookmark}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? `Remove ${title} from bookmarks` : `Bookmark ${title}`}
              className={cn(
                "flex items-center justify-center rounded-none border px-2.5 py-1.5",
                "transition-all duration-200",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 focus-visible:outline-offset-1",
                bookmarked
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-400"
                  : "border-white/20 bg-white/5 text-white/55 hover:border-cyan-500/50 hover:text-cyan-400"
              )}
            >
              <BookmarkIcon filled={bookmarked} />
            </button>
          </div>
        </div>

        {/* ── Foil edge shimmer bar (legendary / mythic) ── */}
        {isFoil && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${palette.accent}cc, ${palette.shimmer[2]}, ${palette.accent}cc, transparent)`,
              opacity: hovered ? 1 : 0.4,
              transition: "opacity 0.3s",
            }}
          />
        )}
      </article>
    </div>
  );
}

// ─── Inline skeleton (used internally when loading=true) ──────────────────────
// Full export lives in HoloCardSkeleton.tsx

function HoloCardSkeletonInline({
  rarity = "common",
  className,
}: {
  rarity?: HoloRarity;
  className?: string;
}) {
  const palette = RARITY_PALETTE[rarity];
  return (
    <div
      aria-busy="true"
      aria-label="Loading card"
      className={cn(
        "relative isolate overflow-hidden rounded-sm aspect-[2/3] w-full",
        "bg-zinc-800/60 animate-pulse ring-1 ring-white/8",
        className
      )}
    >
      {/* Rarity tint at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${palette.accent}18, transparent 60%)`,
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <div className="h-2.5 w-10 rounded bg-white/10" />
        <div className="h-5 w-3/4 rounded bg-white/12" />
        <div className="h-3 w-1/2 rounded bg-white/8" />
        <div className="mt-2 flex gap-1.5">
          <div className="h-7 flex-1 rounded-none bg-white/8" />
          <div className="h-7 w-9 rounded-none bg-white/8" />
        </div>
      </div>
    </div>
  );
}

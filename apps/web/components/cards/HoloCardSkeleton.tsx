// apps/web/components/cards/HoloCardSkeleton.tsx

import { cn } from "@/lib/utils";
import { RARITY_PALETTE, type HoloRarity } from "./HoloCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HoloCardSkeletonProps {
  /**
   * Controls the rarity-tinted bottom gradient so skeleton rows feel
   * intentional rather than generic. Pass the rarity you intend to load.
   */
  rarity?: HoloRarity;
  /**
   * Show the rank badge placeholder in the top-left corner.
   * Pass true when the skeleton is used inside a ranked list.
   */
  showRank?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Standalone skeleton for HoloCard.
 *
 * Matches the exact aspect ratio, corner radius, and z-layering of HoloCard
 * so layout shift is zero when the real card mounts.
 *
 * Usage:
 * ```tsx
 * // In a grid while data is loading:
 * {isLoading
 *   ? Array.from({ length: 6 }).map((_, i) => <HoloCardSkeleton key={i} rarity="rare" />)
 *   : cards.map(c => <HoloCard key={c.slug} {...c} />)
 * }
 * ```
 */
export default function HoloCardSkeleton({
  rarity = "common",
  showRank = false,
  className,
}: HoloCardSkeletonProps) {
  const palette = RARITY_PALETTE[rarity];

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading card"
      className={cn(
        // Match HoloCard outer wrapper
        "relative w-full",
        className
      )}
    >
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-sm aspect-[2/3] w-full",
          "ring-1 ring-white/[0.07]",
          "bg-zinc-900"
        )}
      >
        {/* ── Shimmer sweep animation ── */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_1.8s_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 50%, transparent)",
          }}
        />

        {/* ── Rarity bottom tint ── */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(to top, ${palette.accent}14, transparent 55%)`,
          }}
        />

        {/* ── Top-left: rank placeholder ── */}
        {showRank && (
          <div
            aria-hidden="true"
            className="absolute left-2.5 top-2.5 z-20 h-7 w-7 rounded-none bg-white/8 animate-pulse"
          />
        )}

        {/* ── Top-right: rarity + stamp badges ── */}
        <div
          aria-hidden="true"
          className="absolute right-2.5 top-2.5 z-20 flex flex-col items-end gap-1.5"
        >
          <div className="h-4 w-14 rounded-none bg-white/10 animate-pulse" />
          <div className="h-4 w-10 rounded-none bg-white/8 animate-pulse" />
        </div>

        {/* ── Bottom content block ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          {/* Eyebrow */}
          <div className="mb-1 h-2 w-16 rounded bg-white/8 animate-pulse" />

          {/* Title */}
          <div className="mb-1 h-5 w-3/4 rounded bg-white/12 animate-pulse" />

          {/* Subtitle */}
          <div className="mb-2.5 h-3 w-1/2 rounded bg-white/8 animate-pulse" />

          {/* Tag chips */}
          <div className="mb-2.5 flex gap-1">
            <div className="h-4 w-10 rounded-full bg-white/8 animate-pulse" />
            <div className="h-4 w-14 rounded-full bg-white/8 animate-pulse" />
          </div>

          {/* Action row */}
          <div className="flex gap-1.5">
            <div className="h-7 flex-1 rounded-none bg-white/8 animate-pulse" />
            <div className="h-7 w-9 rounded-none bg-white/8 animate-pulse" />
          </div>
        </div>

        {/* ── Foil top edge for legendary/mythic ── */}
        {(rarity === "legendary" || rarity === "mythic") && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-30 h-[2px] animate-pulse"
            style={{
              background: `linear-gradient(90deg, transparent, ${palette.accent}66, transparent)`,
            }}
          />
        )}
      </div>

      {/* Screen-reader label */}
      <span className="sr-only">Loading {palette.label} card…</span>

      {/* ── Shimmer keyframe injected once via a style tag ── */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

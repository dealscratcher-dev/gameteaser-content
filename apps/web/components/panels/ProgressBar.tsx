/**
 * ProgressBar.tsx
 *
 * A futuristic, accessible XP/season progress bar for TheGameBit platform.
 * Supports animated fill, tier markers, level badges, and skeleton loading.
 * Designed for dark-first UI with Steam/Arc Browser aesthetics.
 */

"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressTier {
  /** Value (0–max) at which this tier marker sits */
  at: number;
  /** Short label shown above the marker (e.g. "Lv.10") */
  label: string;
  /** Whether the user has already passed this tier */
  reached?: boolean;
}

export interface ProgressBarProps {
  /** Current progress value */
  value: number;
  /** Maximum progress value (default: 100) */
  max?: number;
  /** Current level / rank label shown on the left badge */
  currentLevel?: string | number;
  /** Next level / rank label shown on the right badge */
  nextLevel?: string | number;
  /** Optional tier markers rendered along the track */
  tiers?: ProgressTier[];
  /** Accent color key – controls the glow/fill gradient */
  accent?: "orange" | "cyan" | "violet" | "amber" | "rose" | "emerald";
  /** Show XP numbers (value / max) */
  showValues?: boolean;
  /** Animate the fill on mount */
  animate?: boolean;
  /** Skeleton / loading state */
  isLoading?: boolean;
  /** Accessible label for the progress element */
  "aria-label"?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Accent palette map
// ---------------------------------------------------------------------------

const ACCENT_MAP = {
  orange: {
    fill: "from-orange-600 via-amber-500 to-orange-300",
    glow: "shadow-[0_0_18px_2px_rgba(249,115,22,0.45)]",
    text: "text-orange-400",
    border: "border-orange-500/60",
    badgeBg: "bg-orange-950/80",
  },
  cyan: {
    fill: "from-cyan-500 via-sky-400 to-cyan-300",
    glow: "shadow-[0_0_18px_2px_rgba(34,211,238,0.45)]",
    text: "text-cyan-400",
    border: "border-cyan-500/60",
    badgeBg: "bg-cyan-950/80",
  },
  violet: {
    fill: "from-violet-600 via-purple-500 to-fuchsia-400",
    glow: "shadow-[0_0_18px_2px_rgba(139,92,246,0.45)]",
    text: "text-violet-400",
    border: "border-violet-500/60",
    badgeBg: "bg-violet-950/80",
  },
  amber: {
    fill: "from-amber-600 via-yellow-500 to-amber-300",
    glow: "shadow-[0_0_18px_2px_rgba(251,191,36,0.45)]",
    text: "text-amber-400",
    border: "border-amber-500/60",
    badgeBg: "bg-amber-950/80",
  },
  rose: {
    fill: "from-rose-600 via-pink-500 to-rose-300",
    glow: "shadow-[0_0_18px_2px_rgba(244,63,94,0.45)]",
    text: "text-rose-400",
    border: "border-rose-500/60",
    badgeBg: "bg-rose-950/80",
  },
  emerald: {
    fill: "from-emerald-600 via-teal-500 to-emerald-300",
    glow: "shadow-[0_0_18px_2px_rgba(52,211,153,0.45)]",
    text: "text-emerald-400",
    border: "border-emerald-500/60",
    badgeBg: "bg-emerald-950/80",
  },
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LevelBadge({
  label,
  accent,
  side,
}: {
  label: string | number;
  accent: keyof typeof ACCENT_MAP;
  side: "left" | "right";
}) {
  const { text, border, badgeBg } = ACCENT_MAP[accent];
  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "min-w-[2.25rem] h-9 px-2 rounded-md",
        "text-xs font-bold tracking-widest uppercase",
        "border backdrop-blur-sm select-none",
        text,
        border,
        badgeBg,
        side === "right" ? "opacity-50" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

function TierMarker({
  tier,
  pct,
  accent,
}: {
  tier: ProgressTier;
  pct: number;
  accent: keyof typeof ACCENT_MAP;
}) {
  const { text } = ACCENT_MAP[accent];
  return (
    <div
      className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
      style={{ left: `${pct}%` }}
      aria-hidden="true"
    >
      {/* label */}
      <span
        className={[
          "text-[10px] font-semibold tracking-wider mb-1 whitespace-nowrap",
          tier.reached ? text : "text-white/30",
        ].join(" ")}
      >
        {tier.label}
      </span>
      {/* tick */}
      <div
        className={[
          "w-px h-3",
          tier.reached ? "bg-white/60" : "bg-white/20",
        ].join(" ")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  max = 100,
  currentLevel,
  nextLevel,
  tiers,
  accent = "cyan",
  showValues = true,
  animate = true,
  isLoading = false,
  "aria-label": ariaLabel,
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;

  const [displayPct, setDisplayPct] = useState(animate ? 0 : percentage);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate || isLoading) {
      setDisplayPct(percentage);
      return;
    }
    // Smooth CSS transition via state ramp
    const id = requestAnimationFrame(() => {
      setDisplayPct(percentage);
    });
    rafRef.current = id;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [percentage, animate, isLoading]);

  const { fill, glow, text } = ACCENT_MAP[accent];

  if (isLoading) {
    return (
      <div
        className={["flex flex-col gap-3 w-full", className].join(" ")}
        aria-busy="true"
        aria-label="Loading progress"
      >
        {/* badges skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-10 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="flex-1 h-4 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-9 w-10 rounded-md bg-white/[0.06] animate-pulse" />
        </div>
        {/* track skeleton */}
        <div className="h-3 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    );
  }

  return (
    <div className={["flex flex-col gap-2.5 w-full", className].join(" ")}>
      {/* Top row: badges + optional XP values */}
      <div className="flex items-center gap-3">
        {currentLevel !== undefined && (
          <LevelBadge label={currentLevel} accent={accent} side="left" />
        )}

        {/* XP label */}
        {showValues && (
          <div className="flex-1 flex justify-end">
            <span className={["text-xs font-mono tabular-nums", text].join(" ")}>
              {clampedValue.toLocaleString()}
              <span className="text-white/30"> / {max.toLocaleString()} XP</span>
            </span>
          </div>
        )}

        {nextLevel !== undefined && (
          <LevelBadge label={nextLevel} accent={accent} side="right" />
        )}
      </div>

      {/* Tier labels row – only if tiers supplied */}
      {tiers && tiers.length > 0 && (
        <div className="relative h-6 w-full">
          {tiers.map((tier) => (
            <TierMarker
              key={tier.at}
              tier={tier}
              pct={(tier.at / max) * 100}
              accent={accent}
            />
          ))}
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel ?? `Progress: ${clampedValue} of ${max}`}
        className={[
          "relative w-full h-3 rounded-full overflow-hidden",
          "bg-white/[0.07] border border-white/[0.09]",
          "ring-1 ring-inset ring-black/40",
        ].join(" ")}
      >
        {/* Scanline texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 3px)",
          }}
          aria-hidden="true"
        />

        {/* Fill */}
        <div
          className={[
            "absolute inset-y-0 left-0 rounded-full",
            "bg-gradient-to-r",
            fill,
            glow,
            "transition-[width] duration-700 ease-out",
          ].join(" ")}
          style={{ width: `${displayPct}%` }}
          aria-hidden="true"
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute inset-y-0 w-16 -left-8 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2.4s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Tier notch lines on the track */}
        {tiers &&
          tiers.map((tier) => (
            <div
              key={tier.at}
              className="absolute top-0 bottom-0 w-px bg-black/50"
              style={{ left: `${(tier.at / max) * 100}%` }}
              aria-hidden="true"
            />
          ))}
      </div>

      {/* Inline shimmer keyframe (injects once via Tailwind arbitrary) */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(600%); }
        }
      `}</style>
    </div>
  );
}

export default ProgressBar;

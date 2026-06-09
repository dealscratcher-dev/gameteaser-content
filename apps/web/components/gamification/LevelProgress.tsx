"use client";

/**
 * LevelProgress.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Animated XP / level progress bar for TheGameBit profile and overlay UIs.
 *
 * Features
 * ─────────
 * • Smooth CSS transition on progress fill
 * • XP gain delta flash (green +N XP toast above the bar)
 * • Level-up celebration pulse
 * • Skeleton loader
 * • Compact variant for nav/header
 * • Full ARIA labelling
 *
 * Usage
 * ─────
 *   <LevelProgress levelInfo={levelInfo} xpDelta={xpGained} />
 *   <LevelProgress levelInfo={levelInfo} variant="compact" />
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type LevelInfo } from "@/lib/gamification/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LevelProgressVariant = "default" | "compact" | "card";

export interface LevelProgressProps {
  levelInfo: LevelInfo;
  /** Positive XP delta to flash above the bar (0 = no flash) */
  xpDelta?: number;
  variant?: LevelProgressVariant;
  /** Show the numeric XP values below the bar */
  showXPValues?: boolean;
  /** Loading skeleton */
  loading?: boolean;
  className?: string;
  /** Called when level-up animation ends */
  onLevelUpAnimationEnd?: () => void;
}

// ─── Rarity colours per level bracket ────────────────────────────────────────

function levelColor(level: number): {
  bar: string;
  glow: string;
  badge: string;
  text: string;
} {
  if (level >= 80)
    return {
      bar:   "from-amber-400 via-orange-500 to-red-500",
      glow:  "shadow-[0_0_12px_rgba(251,146,60,0.6)]",
      badge: "bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950",
      text:  "text-amber-400",
    };
  if (level >= 50)
    return {
      bar:   "from-violet-500 via-purple-500 to-fuchsia-500",
      glow:  "shadow-[0_0_12px_rgba(139,92,246,0.6)]",
      badge: "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white",
      text:  "text-violet-400",
    };
  if (level >= 25)
    return {
      bar:   "from-cyan-400 via-blue-500 to-violet-500",
      glow:  "shadow-[0_0_12px_rgba(99,102,241,0.5)]",
      badge: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
      text:  "text-cyan-400",
    };
  if (level >= 10)
    return {
      bar:   "from-emerald-400 to-cyan-500",
      glow:  "shadow-[0_0_8px_rgba(52,211,153,0.45)]",
      badge: "bg-gradient-to-br from-emerald-500 to-cyan-600 text-white",
      text:  "text-emerald-400",
    };
  return {
    bar:   "from-zinc-500 to-zinc-400",
    glow:  "",
    badge: "bg-zinc-700 text-zinc-300",
    text:  "text-zinc-400",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBadge({
  level,
  colors,
  pulse,
}: {
  level: number;
  colors: ReturnType<typeof levelColor>;
  pulse: boolean;
}) {
  return (
    <div
      aria-label={`Level ${level}`}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        "font-[family-name:var(--font-barlow-condensed)] text-lg font-extrabold uppercase",
        colors.badge,
        pulse && "animate-[level-pulse_0.6s_ease-out]"
      )}
    >
      {level}
      {pulse && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-white/30"
        />
      )}
    </div>
  );
}

interface XPDeltaFlashProps {
  delta: number;
  visible: boolean;
}
function XPDeltaFlash({ delta, visible }: XPDeltaFlashProps) {
  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "pointer-events-none absolute -top-6 right-0 text-xs font-bold text-emerald-400",
        "transition-all duration-700",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      {visible && `+${delta} XP`}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LevelProgressSkeleton({ variant }: { variant: LevelProgressVariant }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="h-5 w-5 animate-pulse rounded-full bg-white/10" />
        <div className="h-2 flex-1 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

// ─── Progress bar fill ────────────────────────────────────────────────────────

interface BarProps {
  progress: number;
  colors: ReturnType<typeof levelColor>;
  isMaxLevel: boolean;
}
function ProgressBar({ progress, colors, isMaxLevel }: BarProps) {
  const [rendered, setRendered] = useState(0);

  // Animate from 0 to progress on mount / change
  useEffect(() => {
    const id = requestAnimationFrame(() => setRendered(progress));
    return () => cancelAnimationFrame(id);
  }, [progress]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(rendered * 100)}
      aria-label="XP progress"
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10"
    >
      {/* Shimmer layer */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]"
      />
      <div
        aria-hidden="true"
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out",
          colors.bar,
          !isMaxLevel && rendered > 0 && colors.glow
        )}
        style={{ width: isMaxLevel ? "100%" : `${Math.max(0, rendered * 100)}%` }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LevelProgress({
  levelInfo,
  xpDelta = 0,
  variant = "default",
  showXPValues = true,
  loading = false,
  className,
  onLevelUpAnimationEnd,
}: LevelProgressProps) {
  const colors = levelColor(levelInfo.level);
  const [deltaVisible, setDeltaVisible] = useState(false);
  const [levelPulse, setLevelPulse] = useState(false);
  const prevLevelRef = useRef(levelInfo.level);

  // Flash XP delta
  useEffect(() => {
    if (!xpDelta) return;
    setDeltaVisible(true);
    const id = setTimeout(() => setDeltaVisible(false), 2000);
    return () => clearTimeout(id);
  }, [xpDelta]);

  // Pulse on level-up
  useEffect(() => {
    if (levelInfo.level > prevLevelRef.current) {
      setLevelPulse(true);
      const id = setTimeout(() => {
        setLevelPulse(false);
        onLevelUpAnimationEnd?.();
      }, 800);
      prevLevelRef.current = levelInfo.level;
      return () => clearTimeout(id);
    }
    prevLevelRef.current = levelInfo.level;
  }, [levelInfo.level, onLevelUpAnimationEnd]);

  if (loading) return <LevelProgressSkeleton variant={variant} />;

  // ── Compact variant ───────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span
          aria-label={`Level ${levelInfo.level}`}
          className={cn(
            "font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold",
            colors.text
          )}
        >
          {levelInfo.isMaxLevel ? "MAX" : `Lv.${levelInfo.level}`}
        </span>
        <ProgressBar
          progress={levelInfo.progress}
          colors={colors}
          isMaxLevel={levelInfo.isMaxLevel}
        />
      </div>
    );
  }

  // ── Card variant (wider, centred) ─────────────────────────────────────────
  if (variant === "card") {
    return (
      <div className={cn("flex flex-col items-center gap-3 p-4", className)}>
        <LevelBadge level={levelInfo.level} colors={colors} pulse={levelPulse} />
        <div className="w-full space-y-1.5">
          <div className="relative">
            <ProgressBar
              progress={levelInfo.progress}
              colors={colors}
              isMaxLevel={levelInfo.isMaxLevel}
            />
            <XPDeltaFlash delta={xpDelta} visible={deltaVisible} />
          </div>
          {showXPValues && !levelInfo.isMaxLevel && (
            <p className="text-center font-[family-name:var(--font-ibm-plex)] text-[11px] text-white/30">
              {levelInfo.levelXP.toLocaleString()} /{" "}
              {levelInfo.levelXPRequired.toLocaleString()} XP
            </p>
          )}
          {levelInfo.isMaxLevel && (
            <p className="text-center font-[family-name:var(--font-ibm-plex)] text-[11px] text-amber-400/70">
              Maximum level reached
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Default variant ───────────────────────────────────────────────────────
  return (
    <div
      className={cn("flex items-center gap-3", className)}
      aria-label={`Level ${levelInfo.level} — ${Math.round(levelInfo.progress * 100)}% to next level`}
    >
      <LevelBadge level={levelInfo.level} colors={colors} pulse={levelPulse} />

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Label row */}
        <div className="flex items-baseline justify-between">
          <span
            className={cn(
              "font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase",
              colors.text
            )}
          >
            {levelInfo.isMaxLevel
              ? "MAX LEVEL"
              : `Level ${levelInfo.level}`}
          </span>
          {!levelInfo.isMaxLevel && (
            <span className="font-[family-name:var(--font-ibm-plex)] text-[11px] text-white/30">
              Lv. {levelInfo.level + 1}
            </span>
          )}
        </div>

        {/* Bar */}
        <div className="relative">
          <ProgressBar
            progress={levelInfo.progress}
            colors={colors}
            isMaxLevel={levelInfo.isMaxLevel}
          />
          <XPDeltaFlash delta={xpDelta} visible={deltaVisible} />
        </div>

        {/* XP values */}
        {showXPValues && !levelInfo.isMaxLevel && (
          <p className="font-[family-name:var(--font-ibm-plex)] text-[11px] text-white/30">
            {levelInfo.levelXP.toLocaleString()}{" "}
            <span className="text-white/20">/</span>{" "}
            {levelInfo.levelXPRequired.toLocaleString()} XP to next level
          </p>
        )}
      </div>
    </div>
  );
}

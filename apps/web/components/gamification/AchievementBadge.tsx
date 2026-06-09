"use client";

/**
 * AchievementBadge.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Achievement badge display for TheGameBit.
 *
 * Features
 * ─────────
 * • Rarity-coded glow / border / gradient
 * • Unlock shimmer animation (plays once on first render when newly unlocked)
 * • Locked / secret states (blurred emoji, "???" title)
 * • Tooltip with description, XP reward, and rarity on hover
 * • Badge grid wrapper component (AchievementGrid)
 * • Single badge in compact / full / notification variants
 * • Skeleton loader
 *
 * Usage
 * ─────
 *   // Single badge
 *   <AchievementBadge achievement={ach} unlocked={true} />
 *
 *   // Full achievement grid
 *   <AchievementGrid achievements={ACHIEVEMENTS} unlockedIds={unlockedIds} />
 *
 *   // Toast notification (used with pendingNotifications)
 *   <AchievementBadge achievement={ach} unlocked variant="notification" />
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementRarity,
} from "@/lib/gamification/achievements";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AchievementBadgeVariant = "default" | "compact" | "notification";

export interface AchievementBadgeProps {
  achievement: Achievement;
  /** Whether the user has unlocked this achievement */
  unlocked: boolean;
  /** Trigger the unlock shimmer animation */
  playUnlockAnimation?: boolean;
  variant?: AchievementBadgeVariant;
  loading?: boolean;
  className?: string;
  onClick?: (achievement: Achievement) => void;
}

export interface AchievementGridProps {
  achievements?: Achievement[];
  unlockedIds: string[];
  /** Filter by category */
  filterCategory?: Achievement["category"];
  /** Show locked achievements */
  showLocked?: boolean;
  loading?: boolean;
  className?: string;
}

// ─── Rarity styles ────────────────────────────────────────────────────────────

const RARITY_STYLES: Record<
  AchievementRarity,
  { border: string; glow: string; bg: string; label: string; labelColor: string }
> = {
  common: {
    border: "border-zinc-600/50",
    glow: "",
    bg: "bg-zinc-800",
    label: "Common",
    labelColor: "text-zinc-400",
  },
  uncommon: {
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.25)]",
    bg: "bg-emerald-950/50",
    label: "Uncommon",
    labelColor: "text-emerald-400",
  },
  rare: {
    border: "border-blue-500/50",
    glow: "shadow-[0_0_10px_rgba(59,130,246,0.35)]",
    bg: "bg-blue-950/50",
    label: "Rare",
    labelColor: "text-blue-400",
  },
  epic: {
    border: "border-violet-500/60",
    glow: "shadow-[0_0_14px_rgba(139,92,246,0.4)]",
    bg: "bg-violet-950/50",
    label: "Epic",
    labelColor: "text-violet-300",
  },
  legendary: {
    border: "border-amber-500/70",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.45)]",
    bg: "bg-amber-950/40",
    label: "Legendary",
    labelColor: "text-amber-400",
  },
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  achievement: Achievement;
  unlocked: boolean;
  visible: boolean;
}
function AchievementTooltip({ achievement, unlocked, visible }: TooltipProps) {
  const rarity = RARITY_STYLES[achievement.rarity];
  const isSecret = achievement.secret && !unlocked;

  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute -top-2 left-1/2 z-50 w-52 -translate-x-1/2 -translate-y-full",
        "rounded-xl border border-white/10 bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md",
        "transition-all duration-150",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
    >
      {/* Arrow */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900/95"
      />

      <div className="flex items-start gap-2.5">
        <span className={cn("text-2xl leading-none", !unlocked && "opacity-30 blur-[2px]")}>
          {isSecret ? "🔒" : achievement.iconEmoji}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">
            {isSecret ? "???" : achievement.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/50 leading-snug">
            {isSecret ? "Complete hidden objectives to unlock." : achievement.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", rarity.labelColor)}>
              {rarity.label}
            </span>
            {!isSecret && (
              <span className="text-[10px] text-orange-400">+{achievement.xpReward} XP</span>
            )}
          </div>
          {!unlocked && !isSecret && (
            <p className="mt-1 text-[10px] text-white/25 uppercase tracking-wider">Locked</p>
          )}
          {unlocked && (
            <p className="mt-1 text-[10px] text-emerald-400 uppercase tracking-wider">✓ Unlocked</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Unlock shimmer overlay ───────────────────────────────────────────────────

function UnlockShimmer({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-xl",
        "bg-gradient-to-r from-transparent via-white/30 to-transparent",
        "-translate-x-full",
        active && "animate-[shimmer-once_0.8s_ease-out_forwards]"
      )}
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BadgeSkeleton({ variant }: { variant: AchievementBadgeVariant }) {
  if (variant === "compact") {
    return (
      <div
        aria-hidden="true"
        className="h-10 w-10 animate-pulse rounded-xl bg-white/10"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-center gap-2"
    >
      <div className="h-16 w-16 animate-pulse rounded-xl bg-white/10" />
      <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
    </div>
  );
}

// ─── Main Badge Component ─────────────────────────────────────────────────────

export function AchievementBadge({
  achievement,
  unlocked,
  playUnlockAnimation = false,
  variant = "default",
  loading = false,
  className,
  onClick,
}: AchievementBadgeProps) {
  const rarity = RARITY_STYLES[achievement.rarity];
  const isSecret = achievement.secret && !unlocked;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fire shimmer animation once when unlock is triggered
  useEffect(() => {
    if (playUnlockAnimation && unlocked) {
      setShimmerActive(true);
      const id = setTimeout(() => setShimmerActive(false), 900);
      return () => clearTimeout(id);
    }
  }, [playUnlockAnimation, unlocked]);

  if (loading) return <BadgeSkeleton variant={variant} />;

  const showTooltip = () => {
    clearTimeout(tooltipTimerRef.current);
    setTooltipVisible(true);
  };
  const hideTooltip = () => {
    tooltipTimerRef.current = setTimeout(() => setTooltipVisible(false), 80);
  };

  // ── Notification variant ──────────────────────────────────────────────────
  if (variant === "notification") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3",
          "border-amber-500/30 bg-amber-500/10",
          "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
          "animate-[slide-in_0.4s_ease-out]",
          className
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-3xl leading-none">{achievement.iconEmoji}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
            Achievement Unlocked
          </p>
          <p className="text-sm font-semibold text-white">{achievement.title}</p>
          <p className="text-[11px] text-white/50">{achievement.description}</p>
        </div>
        <span className="ml-auto shrink-0 text-xs font-bold text-orange-400">
          +{achievement.xpReward} XP
        </span>
      </div>
    );
  }

  // ── Compact variant ───────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className={cn("relative inline-block", className)}>
        <button
          aria-label={`${isSecret ? "Secret" : achievement.title} achievement — ${unlocked ? "unlocked" : "locked"}`}
          onClick={() => onClick?.(achievement)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border",
            "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
            unlocked
              ? [rarity.border, rarity.glow, rarity.bg]
              : "border-white/10 bg-white/5",
            unlocked ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
        >
          <span
            className={cn(
              "text-xl leading-none transition-all",
              !unlocked && "opacity-20 blur-[1px] grayscale"
            )}
          >
            {isSecret ? "🔒" : achievement.iconEmoji}
          </span>
          <UnlockShimmer active={shimmerActive} />
        </button>
        <AchievementTooltip
          achievement={achievement}
          unlocked={unlocked}
          visible={tooltipVisible}
        />
      </div>
    );
  }

  // ── Default (full) variant ────────────────────────────────────────────────
  return (
    <div className={cn("relative flex flex-col items-center gap-2", className)}>
      <button
        aria-label={`${isSecret ? "Secret" : achievement.title} — ${achievement.rarity} — ${unlocked ? "unlocked" : "locked"}`}
        onClick={() => onClick?.(achievement)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={cn(
          "group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border",
          "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
          unlocked
            ? [rarity.border, rarity.glow, rarity.bg, "cursor-pointer hover:scale-105"]
            : "border-white/[0.06] bg-white/[0.03] cursor-default"
        )}
      >
        <span
          className={cn(
            "text-3xl leading-none transition-all duration-200",
            !unlocked && "opacity-20 blur-[2px] grayscale",
            unlocked && "group-hover:scale-110"
          )}
        >
          {isSecret ? "🔒" : achievement.iconEmoji}
        </span>

        {/* Unlocked checkmark pip */}
        {unlocked && (
          <span
            aria-hidden="true"
            className="absolute bottom-1 right-1 text-[9px] leading-none text-emerald-400"
          >
            ✓
          </span>
        )}

        <UnlockShimmer active={shimmerActive} />
      </button>

      {/* Label */}
      <p
        className={cn(
          "max-w-[5rem] text-center font-[family-name:var(--font-ibm-plex)] text-[11px] leading-tight",
          unlocked ? "text-white/70" : "text-white/20"
        )}
      >
        {isSecret ? "???" : achievement.title}
      </p>

      {/* Rarity pip */}
      {unlocked && (
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-widest",
            rarity.labelColor
          )}
        >
          {rarity.label}
        </span>
      )}

      <AchievementTooltip
        achievement={achievement}
        unlocked={unlocked}
        visible={tooltipVisible}
      />
    </div>
  );
}

// ─── Grid Component ───────────────────────────────────────────────────────────

/**
 * Renders all achievements in a responsive grid.
 * Locked achievements are dimmed; secret+locked achievements hide their details.
 */
export function AchievementGrid({
  achievements = ACHIEVEMENTS,
  unlockedIds,
  filterCategory,
  showLocked = true,
  loading = false,
  className,
}: AchievementGridProps) {
  const unlockedSet = new Set(unlockedIds);

  const filtered = achievements.filter((a) => {
    if (filterCategory && a.category !== filterCategory) return false;
    if (!showLocked && !unlockedSet.has(a.id)) return false;
    return true;
  });

  // Sort: unlocked first, then by rarity order
  const rarityOrder: AchievementRarity[] = [
    "legendary", "epic", "rare", "uncommon", "common",
  ];
  const sorted = [...filtered].sort((a, b) => {
    const aUnlocked = unlockedSet.has(a.id) ? 0 : 1;
    const bUnlocked = unlockedSet.has(b.id) ? 0 : 1;
    if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-8",
          className
        )}
        aria-busy="true"
        aria-label="Loading achievements"
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <BadgeSkeleton key={i} variant="default" />
        ))}
      </div>
    );
  }

  const unlockedCount = filtered.filter((a) => unlockedSet.has(a.id)).length;

  return (
    <section aria-label="Achievements">
      {/* Header summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="font-[family-name:var(--font-ibm-plex)] text-xs text-white/40">
          <span className="text-white">{unlockedCount}</span> / {filtered.length} unlocked
        </p>
        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={unlockedCount}
          aria-valuemin={0}
          aria-valuemax={filtered.length}
          aria-label={`${unlockedCount} of ${filtered.length} achievements unlocked`}
          className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-orange-500 transition-[width] duration-500"
            style={{
              width: `${filtered.length ? (unlockedCount / filtered.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 lg:grid-cols-8",
          className
        )}
      >
        {sorted.map((ach) => (
          <AchievementBadge
            key={ach.id}
            achievement={ach}
            unlocked={unlockedSet.has(ach.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────

export default AchievementBadge;

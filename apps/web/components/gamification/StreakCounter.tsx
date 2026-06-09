"use client";

/**
 * StreakCounter.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Daily streak display for TheGameBit.
 *
 * Features
 * ─────────
 * • Animated flame (intensity scales with streak length)
 * • Milestone progress ring (next STREAK_MILESTONES target)
 * • "Streak at risk" warning when last activity was yesterday
 * • Freeze shield badge (future: streak freeze collectible)
 * • Compact / full / card variants
 * • Skeleton loader
 *
 * Usage
 * ─────
 *   <StreakCounter
 *     streakDays={streakDays}
 *     lastActivityDate={lastActivityDate}
 *     milestoneProgress={milestoneProgress}
 *     nextMilestone={nextMilestone}
 *   />
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  type ISODateString,
  STREAK_MILESTONES,
  nextStreakMilestone,
  toUTCDateString,
} from "@/lib/gamification/streaks";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StreakCounterVariant = "default" | "compact" | "card";

export interface StreakCounterProps {
  streakDays: number;
  lastActivityDate: ISODateString | null;
  /** 0–1 progress toward next milestone */
  milestoneProgress?: number;
  nextMilestone?: ReturnType<typeof nextStreakMilestone>;
  /** Whether the user has a streak freeze active */
  freezeActive?: boolean;
  variant?: StreakCounterVariant;
  loading?: boolean;
  className?: string;
}

// ─── Flame intensity config ───────────────────────────────────────────────────

function flameConfig(streakDays: number): {
  size: string;
  color: string;
  glow: string;
  pulseSpeed: string;
} {
  if (streakDays >= 100)
    return {
      size: "text-4xl",
      color: "text-red-400",
      glow: "drop-shadow-[0_0_12px_rgba(248,113,113,0.9)]",
      pulseSpeed: "animate-[flame-pulse_0.6s_ease-in-out_infinite]",
    };
  if (streakDays >= 30)
    return {
      size: "text-3xl",
      color: "text-orange-400",
      glow: "drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]",
      pulseSpeed: "animate-[flame-pulse_0.8s_ease-in-out_infinite]",
    };
  if (streakDays >= 7)
    return {
      size: "text-2xl",
      color: "text-amber-400",
      glow: "drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]",
      pulseSpeed: "animate-[flame-pulse_1s_ease-in-out_infinite]",
    };
  if (streakDays >= 3)
    return {
      size: "text-xl",
      color: "text-yellow-400",
      glow: "drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]",
      pulseSpeed: "animate-[flame-pulse_1.2s_ease-in-out_infinite]",
    };
  return {
    size: "text-lg",
    color: "text-zinc-400",
    glow: "",
    pulseSpeed: "",
  };
}

// ─── Risk detection ───────────────────────────────────────────────────────────

function useStreakRisk(
  lastActivityDate: ISODateString | null,
  streakDays: number
): { atRisk: boolean; alreadyToday: boolean } {
  return useMemo(() => {
    if (!lastActivityDate || streakDays === 0)
      return { atRisk: false, alreadyToday: false };

    const today = toUTCDateString(new Date());
    const last = toUTCDateString(lastActivityDate);

    if (last === today) return { atRisk: false, alreadyToday: true };

    const diff = Math.round(
      (new Date(today).getTime() - new Date(last).getTime()) / 86_400_000
    );
    return { atRisk: diff === 1, alreadyToday: false };
  }, [lastActivityDate, streakDays]);
}

// ─── SVG milestone ring ───────────────────────────────────────────────────────

function MilestoneRing({
  progress,
  size = 56,
  strokeWidth = 3,
  atRisk,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  atRisk: boolean;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * Math.min(1, Math.max(0, progress));

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={atRisk ? "#f87171" : "#f97316"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: "stroke-dasharray 0.5s ease-out" }}
      />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StreakSkeleton({ variant }: { variant: StreakCounterVariant }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-14 w-14 animate-pulse rounded-full bg-white/10" />
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StreakCounter({
  streakDays,
  lastActivityDate,
  milestoneProgress = 0,
  nextMilestone,
  freezeActive = false,
  variant = "default",
  loading = false,
  className,
}: StreakCounterProps) {
  const flame = flameConfig(streakDays);
  const { atRisk, alreadyToday } = useStreakRisk(lastActivityDate, streakDays);
  const resolvedNextMilestone = nextMilestone ?? nextStreakMilestone(streakDays);

  if (loading) return <StreakSkeleton variant={variant} />;

  // ── Compact variant ───────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div
        aria-label={`${streakDays}-day streak`}
        className={cn("flex items-center gap-1", className)}
      >
        <span
          aria-hidden="true"
          className={cn(flame.color, flame.glow, "text-base leading-none", flame.pulseSpeed)}
        >
          🔥
        </span>
        <span
          className={cn(
            "font-[family-name:var(--font-barlow-condensed)] text-sm font-bold leading-none",
            atRisk ? "text-red-400" : "text-white"
          )}
        >
          {streakDays}
        </span>
        {atRisk && (
          <span aria-label="Streak at risk" className="text-[10px] text-red-400">
            ⚠
          </span>
        )}
      </div>
    );
  }

  // ── Shared ring + flame core ──────────────────────────────────────────────
  const RingCore = (
    <div className="relative flex shrink-0 items-center justify-center">
      <MilestoneRing
        progress={milestoneProgress}
        atRisk={atRisk}
        size={variant === "card" ? 72 : 56}
        strokeWidth={variant === "card" ? 3.5 : 3}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute leading-none",
          flame.size,
          flame.color,
          flame.glow,
          flame.pulseSpeed
        )}
      >
        🔥
      </span>
      {/* Freeze shield */}
      {freezeActive && (
        <span
          aria-label="Streak freeze active"
          title="Streak freeze active"
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-500/30 bg-zinc-900 text-[11px]"
        >
          🛡️
        </span>
      )}
    </div>
  );

  // ── Card variant ──────────────────────────────────────────────────────────
  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5",
          className
        )}
        aria-label={`${streakDays}-day streak`}
      >
        {RingCore}

        <div className="text-center">
          <p
            className={cn(
              "font-[family-name:var(--font-barlow-condensed)] text-3xl font-extrabold leading-none",
              atRisk ? "text-red-400" : "text-white"
            )}
          >
            {streakDays}
            <span className="ml-1 text-lg text-white/40">days</span>
          </p>

          {alreadyToday && (
            <p className="mt-1 text-[11px] text-emerald-400 font-[family-name:var(--font-ibm-plex)]">
              ✓ Logged today
            </p>
          )}

          {atRisk && !freezeActive && (
            <p className="mt-1 text-[11px] text-red-400 font-[family-name:var(--font-ibm-plex)] animate-pulse">
              ⚠ Log in to keep your streak!
            </p>
          )}

          {resolvedNextMilestone && (
            <p className="mt-2 text-[11px] text-white/30 font-[family-name:var(--font-ibm-plex)]">
              Next: {resolvedNextMilestone.label} at {resolvedNextMilestone.days} days
              {resolvedNextMilestone.bonusXP > 0 && (
                <span className="ml-1 text-orange-400">
                  (+{resolvedNextMilestone.bonusXP} XP)
                </span>
              )}
            </p>
          )}

          {!resolvedNextMilestone && (
            <p className="mt-2 text-[11px] text-amber-400 font-[family-name:var(--font-ibm-plex)]">
              All streak milestones achieved!
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
      aria-label={`${streakDays}-day streak${atRisk ? " — at risk" : ""}`}
    >
      {RingCore}

      <div className="min-w-0 space-y-0.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold leading-none",
              atRisk ? "text-red-400" : "text-white"
            )}
          >
            {streakDays}
          </span>
          <span className="font-[family-name:var(--font-ibm-plex)] text-xs text-white/40">
            day{streakDays !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Status line */}
        {alreadyToday && (
          <p className="font-[family-name:var(--font-ibm-plex)] text-[11px] text-emerald-400">
            ✓ Active today
          </p>
        )}
        {atRisk && !freezeActive && (
          <p className="font-[family-name:var(--font-ibm-plex)] text-[11px] text-red-400 animate-pulse">
            ⚠ Log in to keep your streak!
          </p>
        )}
        {freezeActive && (
          <p className="font-[family-name:var(--font-ibm-plex)] text-[11px] text-cyan-400">
            🛡️ Freeze active
          </p>
        )}

        {/* Next milestone */}
        {resolvedNextMilestone && !atRisk && (
          <p className="font-[family-name:var(--font-ibm-plex)] text-[11px] text-white/30">
            {resolvedNextMilestone.days - streakDays}d to{" "}
            <span className="text-orange-400/70">{resolvedNextMilestone.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}

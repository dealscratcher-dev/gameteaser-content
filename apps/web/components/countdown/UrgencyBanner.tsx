// apps/web/components/ui/UrgencyBanner.tsx
//
// Site-level urgency banner for time-critical events, season endings,
// limited drops, and streak-at-risk alerts.

"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import CountdownDisplay from "./CountdownDisplay";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UrgencyLevel =
  | "info"      // Neutral — upcoming event, new content
  | "warning"   // Moderate — season ending in 24h–72h
  | "critical"  // High — ending < 24h, limited availability
  | "streak"    // Gamification — streak at risk
  | "reward"    // Positive — reward / achievement unlocked
  | "drop";     // Hype — limited-time collectible drop live now

export type UrgencyBannerPosition = "top" | "bottom" | "inline";

export interface UrgencyBannerAction {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Visual weight — "primary" renders in orange, "ghost" renders outlined */
  variant?: "primary" | "ghost";
}

export interface UrgencyBannerProps {
  /** Urgency determines color, icon, animation intensity */
  level?: UrgencyLevel;
  /** Main message text */
  message: string;
  /** Secondary detail below the message */
  detail?: string;
  /** If provided, an inline countdown is appended to the message */
  countdownTarget?: string | number | Date;
  /** Up to 2 CTA buttons */
  actions?: UrgencyBannerAction[];
  /** Whether the user can dismiss this banner */
  dismissible?: boolean;
  /** Storage key for persisting dismiss state across sessions */
  dismissKey?: string;
  /** Position — top (fixed), bottom (fixed), or inline (flow) */
  position?: UrgencyBannerPosition;
  /** Auto-hide after this many ms (0 = never) */
  autoDismissMs?: number;
  /** Show an animated progress bar draining toward the deadline */
  showDrainBar?: boolean;
  drainBarTarget?: string | number | Date;
  drainBarDuration?: number; // total season duration in ms (for % calc)
  /** Fires when the countdown expires */
  onExpire?: () => void;
  /** Fires when the user dismisses */
  onDismiss?: () => void;
  /** Show an animated LIVE pulse indicator (used for active drops) */
  showLiveIndicator?: boolean;
  className?: string;
}

// ─── Level config ─────────────────────────────────────────────────────────────

interface LevelConfig {
  icon: string;             // emoji / symbol
  bg: string;               // Tailwind bg classes
  border: string;
  text: string;
  accent: string;
  pulse: boolean;
  scanLine: boolean;
}

const LEVEL_CONFIG: Record<UrgencyLevel, LevelConfig> = {
  info: {
    icon: "ℹ",
    bg: "bg-zinc-900/90",
    border: "border-white/15",
    text: "text-white/80",
    accent: "text-white",
    pulse: false,
    scanLine: false,
  },
  warning: {
    icon: "⏳",
    bg: "bg-amber-950/80",
    border: "border-amber-600/40",
    text: "text-amber-200/80",
    accent: "text-amber-300",
    pulse: false,
    scanLine: false,
  },
  critical: {
    icon: "🔥",
    bg: "bg-orange-950/90",
    border: "border-orange-500/50",
    text: "text-orange-200/90",
    accent: "text-orange-300",
    pulse: true,
    scanLine: true,
  },
  streak: {
    icon: "🔥",
    bg: "bg-red-950/85",
    border: "border-red-600/50",
    text: "text-red-200/90",
    accent: "text-red-300",
    pulse: true,
    scanLine: false,
  },
  reward: {
    icon: "🏆",
    bg: "bg-emerald-950/85",
    border: "border-emerald-600/40",
    text: "text-emerald-200/90",
    accent: "text-emerald-300",
    pulse: false,
    scanLine: false,
  },
  drop: {
    icon: "⚡",
    bg: "bg-purple-950/90",
    border: "border-purple-500/50",
    text: "text-purple-200/90",
    accent: "text-purple-300",
    pulse: true,
    scanLine: true,
  },
};

// ─── Drain bar (time-remaining visual) ────────────────────────────────────────

function DrainBar({
  target,
  totalMs,
  accent,
}: {
  target: string | number | Date;
  totalMs: number;
  accent: string;
}) {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    function calc() {
      const now = Date.now();
      const end =
        target instanceof Date
          ? target.getTime()
          : typeof target === "number"
          ? target
          : new Date(target).getTime();
      const remaining = Math.max(end - now, 0);
      setPct(totalMs > 0 ? (remaining / totalMs) * 100 : 0);
    }
    calc();
    const id = setInterval(calc, 10_000); // update every 10 s — sufficient for drain bar
    return () => clearInterval(id);
  }, [target, totalMs]);

  const dangerColor =
    accent.includes("orange") || accent.includes("red")
      ? "from-orange-500 to-red-500"
      : accent.includes("purple")
      ? "from-purple-500 to-pink-500"
      : accent.includes("emerald")
      ? "from-emerald-500 to-green-400"
      : "from-amber-400 to-orange-400";

  return (
    <div
      aria-label={`${Math.round(pct)}% of time remaining`}
      className="relative h-0.5 w-full overflow-hidden bg-white/10"
    >
      <div
        className={cn("h-full bg-gradient-to-r transition-all duration-[10000ms] ease-linear", dangerColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

function BannerAction({
  action,
  level,
}: {
  action: UrgencyBannerAction;
  level: UrgencyLevel;
}) {
  const config = LEVEL_CONFIG[level];
  const isPrimary = action.variant !== "ghost";

  const baseClass = cn(
    "inline-flex items-center gap-1.5 rounded-none px-4 py-1.5 shrink-0",
    "font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-widest",
    "transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
  );

  const variantClass = isPrimary
    ? cn(
        "border border-current bg-current/15 hover:bg-current/25",
        config.accent
      )
    : "border border-white/20 text-white/50 hover:border-white/40 hover:text-white";

  const Comp = action.href ? "a" : "button";

  return (
    <Comp
      {...(action.href ? { href: action.href } : { type: "button" as const, onClick: action.onClick })}
      className={cn(baseClass, variantClass)}
    >
      {action.label}
    </Comp>
  );
}

// ─── Dismiss Button ───────────────────────────────────────────────────────────

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss banner"
      className="
        ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
        border border-white/15 text-white/30
        transition-colors hover:border-white/30 hover:text-white/70
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
      "
    >
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}
        strokeLinecap="round" className="h-3 w-3" aria-hidden="true">
        <path d="M2 2 10 10M10 2 2 10" />
      </svg>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * UrgencyBanner — site-level notification banner for TheGameBit.
 *
 * Urgency levels:
 * - `info`     — upcoming events, new content (neutral)
 * - `warning`  — season ending in 24–72 h (amber)
 * - `critical` — < 24 h remaining, with pulse (orange)
 * - `streak`   — streak at risk of breaking (red)
 * - `reward`   — achievement / reward unlocked (green)
 * - `drop`     — limited-time collectible live now, with pulse (purple)
 *
 * Features:
 * - Fixed top/bottom or inline flow position
 * - Integrated inline CountdownDisplay
 * - Draining time bar (proportional to total season/event duration)
 * - Dismissible with optional sessionStorage / localStorage persistence
 * - Auto-dismiss timer
 * - Up to 2 CTA buttons (primary + ghost)
 * - Scan-line + pulse animations for critical/drop levels
 *
 * @example
 * <UrgencyBanner
 *   level="critical"
 *   message="Season 3 ends in"
 *   countdownTarget="2025-09-30T23:59:59Z"
 *   actions={[{ label: "Claim Rewards", href: "/season/3/rewards", variant: "primary" }]}
 *   dismissible
 *   dismissKey="season3-banner-dismissed"
 *   position="top"
 *   showDrainBar
 *   drainBarTarget="2025-09-30T23:59:59Z"
 *   drainBarDuration={90 * 24 * 60 * 60 * 1000}
 * />
 */
export default function UrgencyBanner({
  level = "info",
  message,
  detail,
  countdownTarget,
  actions = [],
  dismissible = true,
  dismissKey,
  position = "top",
  autoDismissMs = 0,
  showDrainBar = false,
  drainBarTarget,
  drainBarDuration,
  onExpire,
  onDismiss,
  showLiveIndicator = false,
  className,
}: UrgencyBannerProps) {
  const config = LEVEL_CONFIG[level];

  // ── Dismiss state ──────────────────────────────────────────────────────────
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (dismissKey) {
      const stored =
        typeof window !== "undefined" &&
        (sessionStorage.getItem(dismissKey) === "1" ||
          localStorage.getItem(dismissKey) === "1");
      if (stored) setDismissed(true);
    }
  }, [dismissKey]);

  // Auto-dismiss
  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0) return;
    const id = setTimeout(() => handleDismiss(), autoDismissMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismissMs]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (dismissKey) {
      try {
        sessionStorage.setItem(dismissKey, "1");
      } catch {
        // storage blocked
      }
    }
    onDismiss?.();
  }, [dismissKey, onDismiss]);

  if (!mounted || dismissed) return null;

  // ── Position wrapper classes ───────────────────────────────────────────────
  const positionClass =
    position === "top"
      ? "fixed inset-x-0 top-0 z-[60]"
      : position === "bottom"
      ? "fixed inset-x-0 bottom-0 z-[60]"
      : "w-full";

  return (
    <div
      role="alert"
      aria-live={level === "critical" || level === "streak" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(positionClass, className)}
    >
      {/* Drain bar — top edge if position=top */}
      {showDrainBar && drainBarTarget && drainBarDuration && position === "top" && (
        <DrainBar
          target={drainBarTarget}
          totalMs={drainBarDuration}
          accent={config.accent}
        />
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden border-b",
          config.bg,
          config.border,
          "backdrop-blur-xl",
          position === "bottom" && "border-b-0 border-t"
        )}
      >
        {/* Scan-line overlay */}
        {config.scanLine && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)",
            }}
          />
        )}

        {/* Pulse glow */}
        {config.pulse && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 animate-pulse opacity-10"
            style={{
              background:
                level === "drop"
                  ? "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.6), transparent 70%)"
                  : level === "streak"
                  ? "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.6), transparent 70%)"
                  : "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.7), transparent 70%)",
            }}
          />
        )}

        {/* Content */}
        <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-6">
          {/* Icon */}
          <span
            aria-hidden="true"
            className={cn(
              "shrink-0 text-base leading-none",
              config.pulse && "animate-bounce"
            )}
          >
            {config.icon}
          </span>

          {/* LIVE indicator */}
          {showLiveIndicator && (
            <span className="flex shrink-0 items-center gap-1 rounded-sm bg-red-600/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          )}

          {/* Message + countdown */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <p
              className={cn(
                "font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-wide shrink-0",
                config.accent
              )}
            >
              {message}
            </p>

            {/* Inline countdown */}
            {countdownTarget && (
              <CountdownDisplay
                targetDate={countdownTarget}
                variant="compact"
                size="sm"
                showUrgency={level === "critical" || level === "warning"}
                urgencyThresholdMs={
                  level === "critical"
                    ? 24 * 60 * 60 * 1000
                    : 72 * 60 * 60 * 1000
                }
                onExpire={onExpire}
                className={config.accent}
              />
            )}

            {/* Detail */}
            {detail && (
              <span
                className={cn(
                  "hidden sm:inline text-xs font-[family-name:var(--font-ibm-plex)]",
                  config.text
                )}
              >
                {detail}
              </span>
            )}
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {actions.slice(0, 2).map((action, i) => (
                <BannerAction key={i} action={action} level={level} />
              ))}
            </div>
          )}

          {/* Dismiss */}
          {dismissible && <DismissButton onClick={handleDismiss} />}
        </div>

        {/* Drain bar — bottom edge for inline / bottom position */}
        {showDrainBar && drainBarTarget && drainBarDuration && position !== "top" && (
          <DrainBar
            target={drainBarTarget}
            totalMs={drainBarDuration}
            accent={config.accent}
          />
        )}
      </div>
    </div>
  );
}

// ─── Convenience factory components ───────────────────────────────────────────
// Pre-configured variants for common TheGameBit use cases.

export type SeasonEndBannerProps = Omit<UrgencyBannerProps, "level" | "icon"> & {
  seasonName: string;
  endDate: string | number | Date;
  seasonStartDate: string | number | Date;
};

/**
 * Pre-configured banner for season endings.
 * Automatically selects warning → critical based on time remaining.
 *
 * @example
 * <SeasonEndBanner
 *   seasonName="Season 3: Inferno"
 *   endDate="2025-09-30T23:59:59Z"
 *   seasonStartDate="2025-07-01T00:00:00Z"
 *   actions={[{ label: "View Rewards", href: "/season/3" }]}
 * />
 */
export function SeasonEndBanner({
  seasonName,
  endDate,
  seasonStartDate,
  ...rest
}: SeasonEndBannerProps) {
  const [level, setLevel] = useState<UrgencyLevel>("info");

  useEffect(() => {
    const ms = new Date(endDate).getTime() - Date.now();
    if (ms < 24 * 60 * 60 * 1000) setLevel("critical");
    else if (ms < 72 * 60 * 60 * 1000) setLevel("warning");
    else setLevel("info");

    const check = setInterval(() => {
      const remaining = new Date(endDate).getTime() - Date.now();
      if (remaining < 24 * 60 * 60 * 1000) setLevel("critical");
      else if (remaining < 72 * 60 * 60 * 1000) setLevel("warning");
    }, 60_000);
    return () => clearInterval(check);
  }, [endDate]);

  const seasonDuration =
    new Date(endDate).getTime() - new Date(seasonStartDate).getTime();

  return (
    <UrgencyBanner
      {...rest}
      level={level}
      message={`${seasonName} ends in`}
      countdownTarget={endDate}
      showDrainBar
      drainBarTarget={endDate}
      drainBarDuration={seasonDuration}
      detail="Don't miss out on exclusive season rewards."
    />
  );
}

/**
 * Pre-configured banner for streak-at-risk alerts.
 *
 * @example
 * <StreakRiskBanner
 *   streakDays={14}
 *   resetTime="2025-06-07T00:00:00Z"
 * />
 */
export interface StreakRiskBannerProps {
  streakDays: number;
  /** UTC midnight when the streak will reset if not claimed */
  resetTime: string | number | Date;
  onClaim?: () => void;
  dismissKey?: string;
}

export function StreakRiskBanner({
  streakDays,
  resetTime,
  onClaim,
  dismissKey = "streak-risk-banner",
}: StreakRiskBannerProps) {
  return (
    <UrgencyBanner
      level="streak"
      message={`Your ${streakDays}-day streak resets in`}
      countdownTarget={resetTime}
      detail="Log in now to keep your streak alive."
      actions={[
        {
          label: "Claim Daily XP",
          onClick: onClaim,
          variant: "primary",
        },
      ]}
      dismissible
      dismissKey={dismissKey}
      position="bottom"
    />
  );
}

/**
 * Pre-configured banner for limited-time collectible drops.
 *
 * @example
 * <DropLiveBanner
 *   dropName="Mythic Operator — Ghost Prime"
 *   endDate="2025-06-08T18:00:00Z"
 *   href="/drops/ghost-prime"
 * />
 */
export interface DropLiveBannerProps {
  dropName: string;
  endDate: string | number | Date;
  href?: string;
  onClaim?: () => void;
  dismissKey?: string;
}

export function DropLiveBanner({
  dropName,
  endDate,
  href,
  onClaim,
  dismissKey,
}: DropLiveBannerProps) {
  return (
    <UrgencyBanner
      level="drop"
      message={`⚡ Live Drop: ${dropName}`}
      countdownTarget={endDate}
      detail="Limited quantity. First come, first served."
      actions={[
        {
          label: "Get It Now",
          href,
          onClick: onClaim,
          variant: "primary",
        },
      ]}
      dismissible
      dismissKey={dismissKey}
      showLiveIndicator
      position="top"
    />
  );
}

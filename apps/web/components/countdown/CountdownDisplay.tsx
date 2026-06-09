// apps/web/components/ui/CountdownDisplay.tsx
//
// React component layer over CountdownTimer.ts.
// All hooks are hydration-safe: the initial render matches the server
// (zeroed state), then hydrates on the client once mounted.

"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import {
  computeCountdown,
  isUrgent,
  calculateXpGrant,
  computeLevel,
  evaluateStreak,
  evaluateAllAchievements,
  utcDateString,
  getStreakMilestone,
  type CountdownUnit,
  type XpActionType,
  type XpGrantOptions,
  type XpGrant,
  type LevelInfo,
  type StreakState,
  type Achievement,
  type UserStats,
  type AchievementConditionType,
} from "./CountdownTimer";

// ─────────────────────────────────────────────────────────────────────────────
// § 1  useCountdown
// ─────────────────────────────────────────────────────────────────────────────

export interface UseCountdownOptions {
  /** Target deadline — ISO string, ms timestamp, or Date */
  targetDate: string | number | Date;
  /** Tick interval in ms. Default 1000. Set to 0 to pause. */
  intervalMs?: number;
  /** Fires once when the countdown reaches zero */
  onExpire?: () => void;
}

export interface UseCountdownReturn extends CountdownUnit {
  /** True only after the component has mounted (client-side) */
  hydrated: boolean;
  /** Manually restart the timer (if target date changes dynamically) */
  reset: (newTarget: string | number | Date) => void;
}

/**
 * Hydration-safe countdown hook.
 *
 * The server and first client render both return zeroed state
 * (`hydrated: false`). The interval starts only after mount,
 * preventing React hydration mismatches.
 *
 * @example
 * const { days, hours, minutes, seconds, expired, hydrated } =
 *   useCountdown({ targetDate: "2025-12-31T23:59:59Z", onExpire: () => refetch() });
 */
export function useCountdown({
  targetDate: initialTarget,
  intervalMs = 1000,
  onExpire,
}: UseCountdownOptions): UseCountdownReturn {
  const [target, setTarget] = useState(initialTarget);
  const [hydrated, setHydrated] = useState(false);
  const expiredFiredRef = useRef(false);

  // Zero-state for SSR / pre-hydration
  const ZERO: CountdownUnit = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    expired: false,
  };

  const [unit, setUnit] = useState<CountdownUnit>(ZERO);

  const tick = useCallback(() => {
    const next = computeCountdown(target);
    setUnit(next);
    if (next.expired && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      onExpire?.();
    }
  }, [target, onExpire]);

  useEffect(() => {
    setHydrated(true);
    tick(); // immediate first tick avoids 1 s blank
    if (intervalMs <= 0) return;
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  const reset = useCallback((newTarget: string | number | Date) => {
    expiredFiredRef.current = false;
    setTarget(newTarget);
  }, []);

  return { ...(hydrated ? unit : ZERO), hydrated, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2  useXp
// ─────────────────────────────────────────────────────────────────────────────

export interface UseXpOptions {
  initialTotalXp?: number;
  streakDays?: number;
  seasonMultiplier?: number;
}

export interface UseXpReturn {
  totalXp: number;
  levelInfo: LevelInfo;
  lastGrant: XpGrant | null;
  /** Award XP for an action. Returns the grant for immediate UI feedback. */
  awardXp: (action: XpActionType, opts?: XpGrantOptions) => XpGrant;
  /** Directly set totalXp (e.g. after a Supabase sync) */
  syncXp: (serverTotal: number) => void;
}

/**
 * Client-side XP state manager.
 *
 * Calculates grants locally for instant feedback; persist with
 * `toXpEventRow(userId, grant, entityId)` → Supabase insert.
 *
 * @example
 * const { totalXp, levelInfo, awardXp } = useXp({ initialTotalXp: 4200, streakDays: 7 });
 * const grant = awardXp("like_card", { seasonMultiplier: 1.5 });
 * await supabase.from("xp_events").insert(toXpEventRow(userId, grant, cardSlug));
 */
export function useXp({
  initialTotalXp = 0,
  streakDays = 0,
  seasonMultiplier = 1.0,
}: UseXpOptions = {}): UseXpReturn {
  const [totalXp, setTotalXp] = useState(initialTotalXp);
  const [lastGrant, setLastGrant] = useState<XpGrant | null>(null);

  const levelInfo = useMemo(() => computeLevel(totalXp), [totalXp]);

  const awardXp = useCallback(
    (action: XpActionType, opts: XpGrantOptions = {}): XpGrant => {
      const grant = calculateXpGrant(action, {
        streakDays,
        seasonMultiplier,
        ...opts,
      });
      setTotalXp((prev) => prev + grant.totalXp);
      setLastGrant(grant);
      return grant;
    },
    [streakDays, seasonMultiplier]
  );

  const syncXp = useCallback((serverTotal: number) => {
    setTotalXp(serverTotal);
  }, []);

  return { totalXp, levelInfo, lastGrant, awardXp, syncXp };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3  useStreak
// ─────────────────────────────────────────────────────────────────────────────

export interface UseStreakOptions {
  initialState?: StreakState;
}

export interface UseStreakReturn {
  streak: StreakState;
  /** Call on daily login. Returns the milestone bonus if a threshold was hit. */
  claimDailyStreak: () => {
    updated: StreakState;
    milestone: { bonusXp: number; label: string } | null;
  };
  /** Overwrite with server state after Supabase sync */
  syncStreak: (serverState: StreakState) => void;
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  alreadyClaimedToday: false,
};

/**
 * Manages streak state locally; persist via `toStreakRow(userId, streak)`.
 *
 * @example
 * const { streak, claimDailyStreak } = useStreak({ initialState: serverStreak });
 * const { updated, milestone } = claimDailyStreak();
 * await supabase.from("streaks").upsert(toStreakRow(userId, updated));
 * if (milestone) showToast(`🔥 ${milestone.label} — +${milestone.bonusXp} XP!`);
 */
export function useStreak({
  initialState = DEFAULT_STREAK,
}: UseStreakOptions = {}): UseStreakReturn {
  const [streak, setStreak] = useState<StreakState>(initialState);

  const claimDailyStreak = useCallback(() => {
    const today = utcDateString();
    const updated = evaluateStreak(streak, today);
    setStreak(updated);
    const milestone = getStreakMilestone(updated.currentStreak);
    return { updated, milestone };
  }, [streak]);

  const syncStreak = useCallback((serverState: StreakState) => {
    setStreak(serverState);
  }, []);

  return { streak, claimDailyStreak, syncStreak };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4  useAchievements
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAchievementsOptions {
  achievements: Achievement[];
  unlockedIds?: Set<string>;
}

export interface UseAchievementsReturn {
  unlockedIds: Set<string>;
  /** Newly unlocked since last evaluate call (cleared on next evaluate) */
  newlyUnlocked: Achievement[];
  /**
   * Run evaluation against current stats.
   * Call after any action that might push a stat over a threshold.
   */
  evaluate: (stats: UserStats) => Achievement[];
  /** Sync full unlocked set from server */
  syncUnlocked: (ids: Set<string>) => void;
}

/**
 * Achievement evaluation hook.
 *
 * @example
 * const { newlyUnlocked, evaluate } = useAchievements({ achievements, unlockedIds });
 * const unlocked = evaluate(currentStats);
 * if (unlocked.length) {
 *   await supabase.from("user_achievements")
 *     .insert(toAchievementUnlockRows(userId, unlocked));
 * }
 */
export function useAchievements({
  achievements,
  unlockedIds: initialUnlocked = new Set(),
}: UseAchievementsOptions): UseAchievementsReturn {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(initialUnlocked);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  const evaluate = useCallback(
    (stats: UserStats): Achievement[] => {
      const fresh = evaluateAllAchievements(achievements, stats, unlockedIds);
      if (fresh.length > 0) {
        setUnlockedIds((prev) => new Set([...prev, ...fresh.map((a) => a.id)]));
        setNewlyUnlocked(fresh);
      } else {
        setNewlyUnlocked([]);
      }
      return fresh;
    },
    [achievements, unlockedIds]
  );

  const syncUnlocked = useCallback((ids: Set<string>) => {
    setUnlockedIds(ids);
  }, []);

  return { unlockedIds, newlyUnlocked, evaluate, syncUnlocked };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5  CountdownDisplay — UI component
// ─────────────────────────────────────────────────────────────────────────────

export type CountdownDisplayVariant = "default" | "compact" | "hero" | "pill" | "minimal";
export type CountdownDisplaySize = "sm" | "md" | "lg" | "xl";

export interface CountdownDisplayProps {
  targetDate: string | number | Date;
  /** Label above the countdown (e.g. "Season ends in") */
  label?: string;
  /** Shown after expiry */
  expiredLabel?: string;
  variant?: CountdownDisplayVariant;
  size?: CountdownDisplaySize;
  /** When true the unit digits glow orange when < urgencyThresholdMs from deadline */
  showUrgency?: boolean;
  urgencyThresholdMs?: number;
  /** Show a pulsing "LIVE" indicator beside the label */
  showLiveIndicator?: boolean;
  /** Fires once on expiry */
  onExpire?: () => void;
  className?: string;
}

// Size maps
const DIGIT_SIZE: Record<CountdownDisplaySize, string> = {
  sm: "text-2xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-5xl sm:text-6xl",
  xl: "text-6xl sm:text-7xl md:text-8xl",
};

const LABEL_SIZE: Record<CountdownDisplaySize, string> = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-xs",
  xl: "text-sm",
};

// Pad a number to 2 digits
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Single unit block (e.g. "04 DAYS")
function UnitBlock({
  value,
  label,
  digitClass,
  labelClass,
  urgent,
}: {
  value: string;
  label: string;
  digitClass: string;
  labelClass: string;
  urgent: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          "font-[family-name:var(--font-barlow-condensed)] font-extrabold tabular-nums leading-none tracking-tight transition-colors duration-500",
          digitClass,
          urgent ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)]" : "text-white"
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-ibm-plex)] font-semibold uppercase tracking-[0.18em]",
          labelClass,
          urgent ? "text-orange-400/70" : "text-white/35"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function Separator({ urgent, size }: { urgent: boolean; size: CountdownDisplaySize }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-[family-name:var(--font-barlow-condensed)] font-bold leading-none self-start mt-1",
        size === "sm" ? "text-xl" : size === "md" ? "text-3xl" : size === "lg" ? "text-5xl" : "text-6xl",
        urgent ? "text-orange-500/60" : "text-white/20"
      )}
    >
      :
    </span>
  );
}

/**
 * CountdownDisplay — the primary UI surface for deadline countdowns.
 *
 * Variants:
 * - `default`  — 4-unit block with labels (days/hours/min/sec)
 * - `compact`  — inline "2d 4h 30m 15s" text
 * - `hero`     — oversized, centered, with scan-line background
 * - `pill`     — small single-line badge for cards / hero overlays
 * - `minimal`  — digits only, no labels
 *
 * @example
 * <CountdownDisplay
 *   targetDate="2025-12-31T23:59:59Z"
 *   label="Season 3 ends in"
 *   variant="hero"
 *   size="xl"
 *   showUrgency
 *   onExpire={() => router.refresh()}
 * />
 */
export default function CountdownDisplay({
  targetDate,
  label,
  expiredLabel = "Event Ended",
  variant = "default",
  size = "md",
  showUrgency = true,
  urgencyThresholdMs = 24 * 60 * 60 * 1000,
  showLiveIndicator = false,
  onExpire,
  className,
}: CountdownDisplayProps) {
  const { days, hours, minutes, seconds, expired, hydrated } = useCountdown({
    targetDate,
    onExpire,
  });

  const urgent =
    showUrgency && hydrated && isUrgent(targetDate, urgencyThresholdMs) && !expired;

  const digitClass = DIGIT_SIZE[size];
  const labelClass = LABEL_SIZE[size];

  // ── Expired state ──────────────────────────────────────────────────────────
  if (hydrated && expired) {
    return (
      <div
        aria-label={expiredLabel}
        className={cn(
          "inline-flex items-center gap-2",
          "font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-widest",
          size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl",
          "text-white/30",
          className
        )}
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/20" />
        {expiredLabel}
      </div>
    );
  }

  // ── Pill variant ───────────────────────────────────────────────────────────
  if (variant === "pill") {
    return (
      <div
        aria-label={`${label ? label + " " : ""}${days}d ${hours}h ${minutes}m ${seconds}s`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 backdrop-blur-sm",
          urgent
            ? "border-orange-500/50 bg-orange-950/40 text-orange-300"
            : "border-white/15 bg-zinc-950/60 text-white/70",
          "font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-widest",
          "text-xs transition-colors duration-500",
          className
        )}
      >
        {/* Pulse dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              urgent ? "bg-orange-400" : "bg-white/40"
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              urgent ? "bg-orange-500" : "bg-white/60"
            )}
          />
        </span>
        {!hydrated ? (
          <span className="opacity-0">0d 0h 0m 0s</span>
        ) : (
          <span>
            {days > 0 && `${days}d `}
            {hours}h {pad(minutes)}m {pad(seconds)}s
          </span>
        )}
      </div>
    );
  }

  // ── Compact variant ────────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-baseline gap-1",
          "font-[family-name:var(--font-barlow-condensed)] font-bold uppercase",
          size === "sm" ? "text-sm" : "text-base",
          urgent ? "text-orange-400" : "text-white/70",
          className
        )}
        aria-label={`${days} days ${hours} hours ${minutes} minutes ${seconds} seconds remaining`}
        aria-live="polite"
        aria-atomic="true"
      >
        {!hydrated ? (
          <span className="opacity-0 select-none">—</span>
        ) : (
          <>
            {days > 0 && (
              <span><span className="text-white">{days}</span><span className="text-white/30 text-xs ml-0.5">d</span></span>
            )}
            <span><span className="text-white">{pad(hours)}</span><span className="text-white/30 text-xs ml-0.5">h</span></span>
            <span><span className="text-white">{pad(minutes)}</span><span className="text-white/30 text-xs ml-0.5">m</span></span>
            <span><span className="text-white">{pad(seconds)}</span><span className="text-white/30 text-xs ml-0.5">s</span></span>
          </>
        )}
      </div>
    );
  }

  // ── Minimal variant ────────────────────────────────────────────────────────
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1",
          digitClass,
          "font-[family-name:var(--font-barlow-condensed)] font-extrabold tabular-nums leading-none",
          urgent ? "text-orange-400" : "text-white",
          className
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {!hydrated ? (
          <span className="opacity-0">00:00:00:00</span>
        ) : (
          <span>{pad(days)}:{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        )}
      </div>
    );
  }

  // ── Default + Hero variants ────────────────────────────────────────────────
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "flex flex-col",
        isHero ? "items-center text-center" : "items-start",
        className
      )}
    >
      {/* Label row */}
      {(label || showLiveIndicator) && (
        <div className="mb-3 flex items-center gap-2">
          {showLiveIndicator && (
            <span className="flex items-center gap-1.5" aria-label="Live">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              <span className="font-[family-name:var(--font-barlow-condensed)] text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                Live
              </span>
            </span>
          )}
          {label && (
            <p className="font-[family-name:var(--font-ibm-plex)] text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              {label}
            </p>
          )}
        </div>
      )}

      {/* Hero scan-line background */}
      {isHero && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,1) 1px, rgba(255,255,255,1) 2px)",
            backgroundSize: "100% 4px",
          }}
        />
      )}

      {/* Unit blocks */}
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={
          hydrated
            ? `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`
            : "Loading countdown"
        }
        className={cn(
          "flex items-start gap-1.5 sm:gap-3",
          isHero && "justify-center"
        )}
      >
        {!hydrated ? (
          // SSR placeholder — maintains layout without causing hydration mismatch
          <>
            {[["00", "Days"], ["00", "Hours"], ["00", "Mins"], ["00", "Secs"]].map(([v, l]) => (
              <div key={l} className="flex items-start gap-1.5 sm:gap-3">
                <UnitBlock value={v} label={l} digitClass={cn(digitClass, "opacity-20")} labelClass={cn(labelClass, "opacity-20")} urgent={false} />
              </div>
            ))}
          </>
        ) : (
          <>
            <UnitBlock value={pad(days)} label="Days" digitClass={digitClass} labelClass={labelClass} urgent={urgent} />
            <Separator urgent={urgent} size={size} />
            <UnitBlock value={pad(hours)} label="Hours" digitClass={digitClass} labelClass={labelClass} urgent={urgent} />
            <Separator urgent={urgent} size={size} />
            <UnitBlock value={pad(minutes)} label="Mins" digitClass={digitClass} labelClass={labelClass} urgent={urgent} />
            <Separator urgent={urgent} size={size} />
            <UnitBlock value={pad(seconds)} label="Secs" digitClass={digitClass} labelClass={labelClass} urgent={urgent} />
          </>
        )}
      </div>

      {/* Urgency warning */}
      {urgent && hydrated && (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-500/70 font-[family-name:var(--font-ibm-plex)]">
          <span aria-hidden="true">⚠</span>
          Ending soon
        </p>
      )}
    </div>
  );
}

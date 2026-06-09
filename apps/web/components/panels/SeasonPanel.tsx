/**
 * SeasonPanel.tsx
 *
 * Full season / battle-pass panel for TheGameBit platform.
 * Composes ProgressBar + RewardList into a cohesive futuristic UI.
 * Handles loading, error, and empty states. Dark-first, ARIA-complete.
 *
 * Visual language: Steam × Arc Browser × Netflix — deep space dashboard.
 */

"use client";

import { useState } from "react";
import { ProgressBar, type ProgressTier } from "./ProgressBar";
import { RewardList, type Reward } from "./RewardList";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonInfo {
  id: string;
  /** Season display name, e.g. "Season 4 — Neon Uprising" */
  title: string;
  /** Short tagline / flavour text */
  tagline?: string;
  /** ISO datetime string for season end */
  endsAt?: string;
  /** Cover / banner art URL */
  bannerUrl?: string;
  /** Season number */
  number?: number;
}

export interface UserSeasonProgress {
  currentXp: number;
  maxXp: number;
  currentLevel: number;
  maxLevel: number;
  /** Ordered reward list */
  rewards: Reward[];
  /** Whether the user has purchased the premium pass */
  hasPremium: boolean;
}

export type SeasonPanelTab = "rewards" | "premium";

export interface SeasonPanelProps {
  season: SeasonInfo;
  progress: UserSeasonProgress;
  /** Called when user claims a reward */
  onClaim?: (rewardId: string) => Promise<void> | void;
  /** Called when user clicks "Get Premium Pass" */
  onUpgrade?: () => void;
  /** Loading state – shows full skeleton */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m left`;
}

// ---------------------------------------------------------------------------
// XP tier markers derived from reward list
// ---------------------------------------------------------------------------

function buildTiers(rewards: Reward[], maxXp: number): ProgressTier[] {
  // Pick up to 5 evenly-spread milestones
  const step = Math.max(1, Math.floor(rewards.length / 5));
  return rewards
    .filter((_, i) => i % step === 0)
    .slice(0, 5)
    .map((r) => ({
      at: r.requiredXp,
      label: `Lv.${r.requiredXp / (maxXp / (rewards.length || 1)) | 0 + 1}`,
      reached: r.unlocked || r.claimed,
    }));
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SeasonPanelSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading season data"
    >
      {/* Banner */}
      <div className="h-36 sm:h-44 rounded-2xl bg-white/[0.05]" />
      {/* Progress */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex gap-3 items-center">
          <div className="h-9 w-12 rounded-md bg-white/[0.06]" />
          <div className="flex-1 h-4 rounded-full bg-white/[0.06]" />
          <div className="h-9 w-12 rounded-md bg-white/[0.06]" />
        </div>
        <div className="h-3 rounded-full bg-white/[0.05]" />
      </div>
      {/* Reward grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-white/[0.04] border border-white/[0.05]"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeasonPanel
// ---------------------------------------------------------------------------

export function SeasonPanel({
  season,
  progress,
  onClaim,
  onUpgrade,
  isLoading = false,
  error = null,
  className = "",
}: SeasonPanelProps) {
  const [activeTab, setActiveTab] = useState<SeasonPanelTab>("rewards");

  if (isLoading) return <SeasonPanelSkeleton />;

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 py-20 text-center"
      >
        <span className="text-5xl" aria-hidden="true">
          ⚠️
        </span>
        <p className="text-white/60 text-sm max-w-xs">{error}</p>
      </div>
    );
  }

  const {
    currentXp,
    maxXp,
    currentLevel,
    maxLevel,
    rewards,
    hasPremium,
  } = progress;

  const tiers = buildTiers(rewards, maxXp);

  const freeRewards = rewards.filter((r) => !r.isPremium);
  const premiumRewards = rewards.filter((r) => r.isPremium);
  const displayedRewards =
    activeTab === "rewards" ? freeRewards : premiumRewards;

  const countdown = season.endsAt ? formatCountdown(season.endsAt) : null;

  return (
    <article
      aria-label={`${season.title} season panel`}
      className={["flex flex-col gap-6 w-full", className].join(" ")}
    >
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <header className="relative rounded-2xl overflow-hidden min-h-[9rem] sm:min-h-[11rem] isolate">
        {/* Background art */}
        {season.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={season.bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        ) : (
          /* Generative fallback — deep-space gradient */
          <div
            className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black"
            aria-hidden="true"
          >
            {/* Decorative orbs */}
            <div className="absolute top-4 left-[20%] w-40 h-40 bg-orange-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-[15%] w-56 h-28 bg-amber-600/10 rounded-full blur-3xl" />
          </div>
        )}

        {/* Gradient scrim so text is always readable */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full p-5 sm:p-6 gap-1">
          {/* Season number chip */}
          {season.number !== undefined && (
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">
              Season {season.number}
            </span>
          )}

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
            {season.title}
          </h2>

          {season.tagline && (
            <p className="text-sm text-white/50 font-medium">{season.tagline}</p>
          )}

          {/* Bottom meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {countdown && (
              <div
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-300"
                aria-label={`Season ends in: ${countdown}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    d="M12 7v5l3 3"
                  />
                </svg>
                {countdown}
              </div>
            )}

            {/* Premium status */}
            {hasPremium ? (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ✦ Premium Pass
              </span>
            ) : onUpgrade ? (
              <button
                type="button"
                onClick={onUpgrade}
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 hover:bg-amber-400/20 text-white/50 hover:text-amber-300 border border-white/20 hover:border-amber-400/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                aria-label="Upgrade to Premium Pass"
              >
                ✦ Get Premium
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Progress bar ───────────────────────────────────────────────── */}
      <section
        aria-label="Season XP progress"
        className="px-1"
      >
        <ProgressBar
          value={currentXp}
          max={maxXp}
          currentLevel={`Lv.${currentLevel}`}
          nextLevel={`Lv.${Math.min(currentLevel + 1, maxLevel)}`}
          tiers={tiers}
          accent="orange"
          showValues
          animate
          aria-label={`Season XP: ${currentXp} of ${maxXp}`}
        />
      </section>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Season reward tracks"
        className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] w-full sm:w-fit"
      >
        {(["rewards", "premium"] as SeasonPanelTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const count =
            tab === "rewards" ? freeRewards.length : premiumRewards.length;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab}`}
              id={`tab-${tab}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "relative flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50",
                isActive
                  ? "bg-white/10 text-white shadow-inner shadow-black/20"
                  : "text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {tab === "rewards" ? "Free Track" : "Premium Track"}
              {count > 0 && (
                <span
                  className={[
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white/[0.06] text-white/30",
                  ].join(" ")}
                  aria-label={`${count} rewards`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Reward list ────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/30 rounded-xl"
      >
        {!hasPremium && activeTab === "premium" ? (
          /* Premium upsell */
          <div className="flex flex-col items-center gap-5 py-14 text-center">
            <div
              className="text-5xl animate-[pulse_3s_ease-in-out_infinite]"
              aria-hidden="true"
            >
              ✦
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <h3 className="text-white font-bold tracking-wide">
                Premium Rewards
              </h3>
              <p className="text-white/40 text-sm">
                Unlock exclusive cosmetics, frames, and bonuses with the Premium
                Pass.
              </p>
            </div>
            {onUpgrade && (
              <button
                type="button"
                onClick={onUpgrade}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black text-sm font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Upgrade to Premium Pass"
              >
                Upgrade Now
              </button>
            )}
          </div>
        ) : (
          <RewardList
            rewards={displayedRewards}
            currentXp={currentXp}
            onClaim={onClaim}
          />
        )}
      </div>
    </article>
  );
}

export default SeasonPanel;

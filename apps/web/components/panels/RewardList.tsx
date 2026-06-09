/**
 * RewardList.tsx
 *
 * Season/battle-pass reward grid for TheGameBit platform.
 * Renders reward cards in locked / unlocked / claimed states with
 * animated reveal, rarity tiers, and accessible claim actions.
 * Dark-first, mobile-responsive, keyboard navigable.
 */

"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RewardRarity = "common" | "rare" | "epic" | "legendary";
export type RewardType =
  | "badge"
  | "avatar"
  | "frame"
  | "emote"
  | "title"
  | "xp_boost"
  | "cosmetic";

export interface Reward {
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Image / icon URL */
  imageUrl?: string;
  /** Emoji fallback when no image provided */
  emoji?: string;
  /** Reward category */
  type: RewardType;
  rarity: RewardRarity;
  /** XP required to unlock this reward */
  requiredXp: number;
  /** Whether the user has enough XP (unlocked but not yet claimed) */
  unlocked: boolean;
  /** Whether the reward has already been claimed */
  claimed: boolean;
  /** Mark as free-track (vs premium) */
  isPremium?: boolean;
}

export interface RewardListProps {
  rewards: Reward[];
  /** Current user XP – used to derive lock state visually */
  currentXp: number;
  /** Maximum XP in the season */
  maxXp?: number;
  /** Called when user clicks "Claim" on an unlocked reward */
  onClaim?: (rewardId: string) => Promise<void> | void;
  /** Skeleton loading state */
  isLoading?: boolean;
  /** How many skeleton cards to show while loading */
  skeletonCount?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Rarity config
// ---------------------------------------------------------------------------

const RARITY = {
  common: {
    label: "Common",
    border: "border-white/20",
    glow: "",
    badge: "bg-white/10 text-white/50",
    titleColor: "text-white/80",
  },
  rare: {
    label: "Rare",
    border: "border-sky-500/50",
    glow: "shadow-[0_0_14px_0px_rgba(56,189,248,0.30)]",
    badge: "bg-sky-900/60 text-sky-300",
    titleColor: "text-sky-200",
  },
  epic: {
    label: "Epic",
    border: "border-violet-500/60",
    glow: "shadow-[0_0_16px_0px_rgba(139,92,246,0.38)]",
    badge: "bg-violet-900/60 text-violet-300",
    titleColor: "text-violet-200",
  },
  legendary: {
    label: "Legendary",
    border: "border-amber-400/70",
    glow: "shadow-[0_0_20px_2px_rgba(251,191,36,0.38)]",
    badge: "bg-amber-900/60 text-amber-300",
    titleColor: "text-amber-200",
  },
} as const;

const TYPE_ICONS: Record<RewardType, string> = {
  badge: "🏅",
  avatar: "🧬",
  frame: "🖼",
  emote: "✨",
  title: "📜",
  xp_boost: "⚡",
  cosmetic: "🎨",
};

// ---------------------------------------------------------------------------
// RewardCard
// ---------------------------------------------------------------------------

interface RewardCardProps {
  reward: Reward;
  onClaim?: (id: string) => Promise<void> | void;
}

function RewardCard({ reward, onClaim }: RewardCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const r = RARITY[reward.rarity];
  const isLocked = !reward.unlocked && !reward.claimed;
  const isClaimed = reward.claimed || justClaimed;

  async function handleClaim() {
    if (!onClaim || isClaimed || isLocked || claiming) return;
    setClaiming(true);
    try {
      await onClaim(reward.id);
      setJustClaimed(true);
    } finally {
      setClaiming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClaim();
    }
  }

  return (
    <article
      className={[
        "relative flex flex-col rounded-xl border overflow-hidden",
        "bg-gradient-to-b from-white/[0.04] to-black/20 backdrop-blur-sm",
        "transition-all duration-300",
        r.border,
        r.glow,
        isLocked
          ? "opacity-50 grayscale"
          : "hover:-translate-y-0.5 hover:brightness-110",
        reward.isPremium
          ? "ring-1 ring-inset ring-amber-400/20"
          : "",
      ].join(" ")}
      aria-label={`${reward.name}, ${r.label} ${reward.type}${isClaimed ? ", claimed" : isLocked ? ", locked" : ", ready to claim"}`}
    >
      {/* Premium badge */}
      {reward.isPremium && (
        <div
          className="absolute top-2 right-2 z-10 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30"
          aria-label="Premium reward"
        >
          PRO
        </div>
      )}

      {/* Image / icon area */}
      <div
        className={[
          "relative flex items-center justify-center h-28 sm:h-32",
          "bg-gradient-to-br from-white/[0.03] to-transparent",
        ].join(" ")}
        aria-hidden="true"
      >
        {reward.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reward.imageUrl}
            alt=""
            className={[
              "h-16 w-16 object-contain rounded-lg",
              isLocked ? "blur-sm" : "",
            ].join(" ")}
            loading="lazy"
          />
        ) : (
          <span
            className={["text-4xl select-none", isLocked ? "blur-sm" : ""].join(
              " "
            )}
          >
            {reward.emoji ?? TYPE_ICONS[reward.type]}
          </span>
        )}

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V7a4.5 4.5 0 00-9 0v3.5M5 10.5h14a1 1 0 011 1V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5a1 1 0 011-1z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Rarity + type */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={[
              "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
              r.badge,
            ].join(" ")}
          >
            {r.label}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-white/30">
            {reward.type.replace("_", " ")}
          </span>
        </div>

        {/* Name */}
        <h3
          className={[
            "text-sm font-bold leading-snug truncate",
            r.titleColor,
          ].join(" ")}
        >
          {reward.name}
        </h3>

        {/* Description */}
        {reward.description && (
          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 flex-1">
            {reward.description}
          </p>
        )}

        {/* XP requirement */}
        <p className="text-[10px] font-mono text-white/30 mt-auto">
          {reward.requiredXp.toLocaleString()} XP required
        </p>

        {/* Claim button */}
        {!isLocked && (
          <button
            type="button"
            onClick={handleClaim}
            onKeyDown={handleKeyDown}
            disabled={isClaimed || claiming}
            aria-pressed={isClaimed}
            aria-label={
              isClaimed
                ? `${reward.name} already claimed`
                : `Claim ${reward.name}`
            }
            className={[
              "mt-1 w-full py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase",
              "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
              isClaimed
                ? "bg-white/[0.06] text-white/30 cursor-default"
                : claiming
                ? "bg-white/10 text-white/50 cursor-wait"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 focus-visible:ring-white/50 active:scale-95",
            ].join(" ")}
          >
            {isClaimed ? "✓ Claimed" : claiming ? "Claiming…" : "Claim"}
          </button>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border border-white/[0.07] overflow-hidden bg-white/[0.03] animate-pulse"
      aria-hidden="true"
    >
      <div className="h-28 sm:h-32 bg-white/[0.04]" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-16 bg-white/[0.07] rounded" />
        <div className="h-4 w-3/4 bg-white/[0.07] rounded" />
        <div className="h-3 w-full bg-white/[0.05] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.05] rounded" />
        <div className="h-7 mt-2 bg-white/[0.06] rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RewardList
// ---------------------------------------------------------------------------

export function RewardList({
  rewards,
  currentXp: _currentXp,
  onClaim,
  isLoading = false,
  skeletonCount = 8,
  className = "",
}: RewardListProps) {
  if (isLoading) {
    return (
      <section
        aria-label="Loading rewards"
        aria-busy="true"
        className={[
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3",
          className,
        ].join(" ")}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    );
  }

  if (rewards.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-16 text-white/30 gap-3"
      >
        <span className="text-4xl" aria-hidden="true">
          🎁
        </span>
        <p className="text-sm font-medium tracking-wide">No rewards available</p>
      </div>
    );
  }

  const unclaimedCount = rewards.filter((r) => r.unlocked && !r.claimed).length;

  return (
    <section
      aria-label={`Season rewards. ${unclaimedCount} reward${unclaimedCount !== 1 ? "s" : ""} ready to claim.`}
      className={["flex flex-col gap-4", className].join(" ")}
    >
      {/* Summary strip */}
      {unclaimedCount > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-300 text-xs font-semibold"
        >
          <span aria-hidden="true">⚡</span>
          {unclaimedCount} reward{unclaimedCount !== 1 ? "s" : ""} ready to claim
        </div>
      )}

      <ul
        className={[
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 list-none p-0 m-0",
        ].join(" ")}
      >
        {rewards.map((reward) => (
          <li key={reward.id}>
            <RewardCard reward={reward} onClaim={onClaim} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RewardList;

"use client";

/**
 * StreakButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Button that allows users to log their daily activity and earn streak rewards.
 * Includes optimistic updates, XP flash animation, and confetti on rewards.
 */

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  type ISODateString,
  type StreakResult,
  type UserGameProfile,
  STREAK_MILESTONES,
  nextStreakMilestone,
  toUTCDateString,
} from "./gamification";
import { useStreak } from "./useGamification";
import { ConfettiCanvas, type ConfettiHandle } from "./Confetti";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakButtonProps {
  /** Current user profile (streak, last activity, XP, etc.) */
  profile: Pick<
    UserGameProfile,
    "streakDays" | "lastActivityDate" | "xp"
  >;
  /**
   * Called after the optimistic state update with the full StreakResult.
   * Use this to persist the new state to your backend.
   */
  onActivityLogged?: (result: StreakResult) => void;
  /** Show XP flash animation on milestone XP gain */
  showXPReward?: boolean;
  /** Called when a reward is unlocked (e.g., collectible) */
  onRewardUnlocked?: (rewardId: string) => void;
  variant?: "default" | "compact" | "pill";
  disabled?: boolean;
  className?: string;
}

// ─── XP Flash Component ──────────────────────────────────────────────────────

function XPFlash({ xp, visible }: { xp: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[xp-pop_0.5s_ease-out_forwards] pointer-events-none z-50">
      <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-lg font-bold text-white shadow-lg">
        +{xp} XP
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StreakButton({
  profile,
  onActivityLogged,
  showXPReward = true,
  onRewardUnlocked,
  variant = "default",
  disabled = false,
  className,
}: StreakButtonProps) {
  const confettiRef = useRef<ConfettiHandle>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { streakDays, lastActivityDate, registerActivity } = useStreak(profile as UserGameProfile);

  const [loading, setLoading] = useState(false);
  const [rollbackData, setRollbackData] = useState<{
    streakDays: number;
    lastActivityDate: ISODateString | null;
  } | null>(null);
  const [xpFlash, setXPFlash] = useState(0);
  const [xpFlashVisible, setXPFlashVisible] = useState(false);

  const alreadyLoggedToday = lastActivityDate === toUTCDateString(new Date());

  const handleClick = useCallback(async () => {
    if (disabled || loading || alreadyLoggedToday) return;

    // Optimistic update: store current state for rollback
    setRollbackData({
      streakDays,
      lastActivityDate,
    });

    setLoading(true);

    try {
      const result = registerActivity(); // synchronous now, returns StreakResult | null

      if (!result) {
        throw new Error("Failed to register activity");
      }

      // ✅ SAFE XP flash: handle optional bonusXP
      const bonus = result.bonusXP ?? 0;
      if (bonus > 0 && showXPReward) {
        setXPFlash(bonus);
        setXPFlashVisible(true);
        setTimeout(() => setXPFlashVisible(false), 2000);
      }

      // Confetti on reward unlock
      if (result.rewardUnlocked) {
        confettiRef.current?.fire({ intensity: 150, duration: 2500 });
        onRewardUnlocked?.(result.rewardUnlocked);
      }

      // Notify parent (e.g., to persist to backend)
      onActivityLogged?.(result);
    } catch (err) {
      console.error("Failed to log streak activity", err);
      // Rollback optimistic update if necessary – parent should handle via onActivityLogged error
      // For simplicity, we just reload profile data
      window.location.reload();
    } finally {
      setLoading(false);
      setRollbackData(null);
    }
  }, [
    disabled,
    loading,
    alreadyLoggedToday,
    streakDays,
    lastActivityDate,
    registerActivity,
    showXPReward,
    onRewardUnlocked,
    onActivityLogged,
  ]);

  // Button text variants
  const buttonText = alreadyLoggedToday
    ? "✓ Logged Today"
    : loading
    ? "Logging..."
    : "Log Activity";

  const buttonClasses = cn(
    "relative overflow-hidden transition-all duration-200 font-medium",
    variant === "compact" && "px-3 py-1 text-sm rounded-full",
    variant === "pill" && "px-5 py-2 rounded-full",
    variant === "default" && "px-6 py-2.5 rounded-lg",
    alreadyLoggedToday && "bg-emerald-600/20 text-emerald-400 cursor-default",
    !alreadyLoggedToday && !disabled && "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  return (
    <>
      <ConfettiCanvas ref={confettiRef} />
      <XPFlash xp={xpFlash} visible={xpFlashVisible} />
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={disabled || loading || alreadyLoggedToday}
        className={buttonClasses}
      >
        {buttonText}
      </button>
    </>
  );
}

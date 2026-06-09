// apps/web/components/streaks/useGamification.ts
import { useState, useEffect, useCallback } from "react";
import type { ISODateString, StreakResult, UserGameProfile } from "./gamification";
import { nextStreakMilestone, toUTCDateString, unlockStreakReward, STREAK_MILESTONES } from "./gamification";

export function useStreak(profile: UserGameProfile | null) {
  const [localProfile, setLocalProfile] = useState<UserGameProfile | null>(profile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // ✅ Synchronous version – no Promise
  const registerActivity = useCallback((): StreakResult | null => {
    if (!localProfile) return null;

    const today = toUTCDateString(new Date());
    const last = localProfile.lastActivityDate;
    let newStreakDays = localProfile.streakDays;
    let xpEarned = 0;

    // Only update if not already logged today
    if (last !== today) {
      // Calculate new streak
      if (last === null) {
        newStreakDays = 1;
      } else {
        const diff = Math.round((new Date(today).getTime() - new Date(last).getTime()) / 86400000);
        if (diff === 1) {
          newStreakDays = localProfile.streakDays + 1;
        } else if (diff > 1) {
          newStreakDays = 1;
        }
      }

      // Check for milestone reward
      const rewardId = unlockStreakReward(newStreakDays);
      const milestone = nextStreakMilestone(newStreakDays);
      if (milestone && newStreakDays === milestone.days) {
        xpEarned = milestone.bonusXP;
      }

      // Update profile
      const updatedProfile: UserGameProfile = {
        ...localProfile,
        streakDays: newStreakDays,
        lastActivityDate: today,
        totalXP: (localProfile.totalXP || 0) + xpEarned,
        xp: (localProfile.xp || 0) + xpEarned,
      };
      setLocalProfile(updatedProfile);
      localStorage.setItem("user_streak_profile", JSON.stringify(updatedProfile));

      // Calculate milestone progress
      const nextMilestone = nextStreakMilestone(newStreakDays);
      let milestoneProgress = 0;
      if (nextMilestone) {
        const prevMilestoneDays = nextMilestone.days === 3 ? 0 : (STREAK_MILESTONES.find(m => m.days === nextMilestone.days - 1)?.days ?? 0);
        const range = nextMilestone.days - prevMilestoneDays;
        const progressInRange = newStreakDays - prevMilestoneDays;
        milestoneProgress = Math.min(1, progressInRange / range);
      } else {
        milestoneProgress = 1;
      }

      return {
        streakDays: newStreakDays,
        lastActivityDate: today,
        milestoneProgress,
        nextMilestone: nextMilestone,
        rewardUnlocked: rewardId,
        bonusXP: xpEarned,
      };
    }

    // Already logged today – no XP earned
    return {
      streakDays: localProfile.streakDays,
      lastActivityDate: localProfile.lastActivityDate!,
      milestoneProgress: 1,
      nextMilestone: nextStreakMilestone(localProfile.streakDays),
      rewardUnlocked: null,
      bonusXP: 0,
    };
  }, [localProfile]);

  return {
    streakDays: localProfile?.streakDays ?? 0,
    lastActivityDate: localProfile?.lastActivityDate ?? null,
    registerActivity, // now returns StreakResult | null directly (not a Promise)
  };
}

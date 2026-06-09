// apps/web/components/streaks/gamification.ts
export {
  type ISODateString,
  type StreakMilestone,
  type UserGameProfile,
  type StreakResult,
  STREAK_MILESTONES,
  nextStreakMilestone,
  toUTCDateString,
  STREAK_REWARDS,
  unlockStreakReward,
  isStreakRewardUnlocked,
  getUnlockedStreakRewards,
  nextStreakRewardThreshold,
} from "@/lib/gamification/streaks";

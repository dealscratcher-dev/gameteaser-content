/**
 * Gamification Streaks Library
 * ----------------------------
 * Provides helper functions to map a user's daily activity streak to
 * collectible rewards, and persists which streak rewards have been earned.
 * The data lives in `localStorage` under the key `user_streak_rewards`.
 */

/** Mapping from streak length to a reward identifier */
export const STREAK_REWARDS: Record<number, string> = {
  3: 'streak_3',
  5: 'streak_5',
  7: 'streak_7',
  14: 'streak_14',
  30: 'streak_30',
};

// ─── Existing reward logic ─────────────────────────────────────────────────

function getUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem('user_streak_rewards');
    const arr = raw ? JSON.parse(raw) : [];
    return new Set<string>(arr);
  } catch {
    return new Set();
  }
}

function setUnlocked(set: Set<string>) {
  localStorage.setItem('user_streak_rewards', JSON.stringify(Array.from(set)));
}

export function unlockStreakReward(currentStreak: number): string | null {
  const thresholds = Object.keys(STREAK_REWARDS)
    .map(Number)
    .filter((t) => t <= currentStreak)
    .sort((a, b) => b - a);
  if (!thresholds.length) return null;
  const rewardId = STREAK_REWARDS[thresholds[0]];
  const unlocked = getUnlocked();
  if (unlocked.has(rewardId)) return null;
  unlocked.add(rewardId);
  setUnlocked(unlocked);
  return rewardId;
}

export function isStreakRewardUnlocked(id: string): boolean {
  return getUnlocked().has(id);
}

export function getUnlockedStreakRewards(): string[] {
  return Array.from(getUnlocked());
}

export function nextStreakRewardThreshold(currentStreak: number): number | null {
  const future = Object.keys(STREAK_REWARDS)
    .map(Number)
    .filter((t) => t > currentStreak)
    .sort((a, b) => a - b);
  return future.length ? future[0] : null;
}

// ─── Types & utilities required by StreakCounter ───────────────────────────

export type ISODateString = string; // YYYY-MM-DD

export interface StreakMilestone {
  days: number;
  label: string;
  bonusXP: number;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, label: "3-Day Streak", bonusXP: 10 },
  { days: 5, label: "5-Day Streak", bonusXP: 15 },
  { days: 7, label: "7-Day Streak", bonusXP: 20 },
  { days: 14, label: "14-Day Streak", bonusXP: 30 },
  { days: 30, label: "30-Day Streak", bonusXP: 50 },
];

export function nextStreakMilestone(currentStreak: number): StreakMilestone | null {
  const next = STREAK_MILESTONES.find(m => m.days > currentStreak);
  return next || null;
}

export function toUTCDateString(date: Date | string): ISODateString {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] as ISODateString;
}

// ─── Additional types required by StreakButton ─────────────────────────────

export interface UserGameProfile {
  streakDays: number;
  lastActivityDate: ISODateString | null;
  totalXP?: number;
  level?: number;
  xp?: number;          // added to satisfy StreakButton's Pick<..., "xp">
  // extend with any other profile fields you need
}

export interface StreakResult {
  streakDays: number;
  lastActivityDate: ISODateString | null;
  milestoneProgress: number;
  nextMilestone: StreakMilestone | null;
  rewardUnlocked?: string | null;
  bonusXP?: number;     // ← ADDED – XP earned from milestone (for flash animation)
}

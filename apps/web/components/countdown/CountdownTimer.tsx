// apps/web/lib/countdown/CountdownTimer.ts
//
// Pure TypeScript countdown + gamification engine.
// No React imports — this file is safe to import from server components,
// edge functions, and Supabase RPC helpers.

// ─── Countdown ────────────────────────────────────────────────────────────────

export interface CountdownUnit {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Total milliseconds remaining (negative when expired) */
  totalMs: number;
  /** Whether the deadline has passed */
  expired: boolean;
}

/**
 * Compute the time remaining between now (UTC) and a target date.
 * Always derives from Date.now() — safe to call on server or client.
 *
 * @param targetDate - ISO string, timestamp (ms), or Date instance
 */
export function computeCountdown(targetDate: string | number | Date): CountdownUnit {
  const target =
    targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: diff, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs: diff, expired: false };
}

/**
 * Given a target date, return true if it falls within `withinMs`
 * milliseconds from now (urgency window).
 */
export function isUrgent(
  targetDate: string | number | Date,
  withinMs: number = 24 * 60 * 60 * 1000 // 24 h default
): boolean {
  const { totalMs, expired } = computeCountdown(targetDate);
  return !expired && totalMs <= withinMs;
}

/**
 * Format a CountdownUnit to a compact string like "2d 4h 30m 15s".
 * Useful for og:description, meta tags, or server-rendered hints.
 */
export function formatCountdown(
  unit: CountdownUnit,
  opts: { compact?: boolean; showSeconds?: boolean } = {}
): string {
  if (unit.expired) return "Ended";
  const { compact = false, showSeconds = true } = opts;
  const parts: string[] = [];
  if (unit.days > 0) parts.push(`${unit.days}${compact ? "d" : " day" + (unit.days !== 1 ? "s" : "")}`);
  if (unit.hours > 0 || unit.days > 0) parts.push(`${unit.hours}${compact ? "h" : " hr" + (unit.hours !== 1 ? "s" : "")}`);
  if (unit.days === 0) parts.push(`${unit.minutes}${compact ? "m" : " min"}`);
  if (showSeconds && unit.days === 0) parts.push(`${unit.seconds}${compact ? "s" : " sec"}`);
  return parts.join(compact ? " " : " : ");
}

// ─── XP Engine ────────────────────────────────────────────────────────────────

export type XpActionType =
  | "view_card"
  | "like_card"
  | "share_card"
  | "bookmark_card"
  | "complete_quiz"
  | "daily_login"
  | "streak_bonus"
  | "purchase"
  | "achievement_unlock"
  | "first_of_type"
  | "comment"
  | "rate_content";

export interface XpActionConfig {
  base: number;
  /** Multiplier applied on top of base (1.0 = no change) */
  multiplier: number;
  /** If true, this action can only be scored once per day per entity */
  onceDailyPerEntity: boolean;
  /** Hard cap per day across all instances of this action */
  dailyCap: number | null;
}

export const XP_ACTION_CONFIG: Record<XpActionType, XpActionConfig> = {
  view_card:           { base: 1,   multiplier: 1.0, onceDailyPerEntity: true,  dailyCap: 50   },
  like_card:           { base: 5,   multiplier: 1.0, onceDailyPerEntity: true,  dailyCap: 100  },
  share_card:          { base: 10,  multiplier: 1.0, onceDailyPerEntity: true,  dailyCap: 100  },
  bookmark_card:       { base: 5,   multiplier: 1.0, onceDailyPerEntity: true,  dailyCap: 100  },
  complete_quiz:       { base: 50,  multiplier: 1.0, onceDailyPerEntity: false, dailyCap: 500  },
  daily_login:         { base: 20,  multiplier: 1.0, onceDailyPerEntity: false, dailyCap: 20   },
  streak_bonus:        { base: 10,  multiplier: 1.0, onceDailyPerEntity: false, dailyCap: null },
  purchase:            { base: 0,   multiplier: 1.0, onceDailyPerEntity: false, dailyCap: null },
  achievement_unlock:  { base: 100, multiplier: 1.0, onceDailyPerEntity: false, dailyCap: null },
  first_of_type:       { base: 25,  multiplier: 1.0, onceDailyPerEntity: false, dailyCap: null },
  comment:             { base: 8,   multiplier: 1.0, onceDailyPerEntity: true,  dailyCap: 80   },
  rate_content:        { base: 5,   multiplier: 1.0, onceDailyPerEntity: true,  dailyCap: 50   },
};

export interface XpGrant {
  action: XpActionType;
  baseXp: number;
  bonusXp: number;
  totalXp: number;
  /** Reason the bonus was applied (empty if none) */
  bonusReason: string;
}

export interface XpGrantOptions {
  /** Streak length — used to scale streak_bonus */
  streakDays?: number;
  /** Custom multiplier (e.g. from active season pass) */
  seasonMultiplier?: number;
  /** Custom flat bonus (e.g. from event) */
  eventBonus?: number;
}

/**
 * Calculate the XP awarded for a given action.
 * Pure function — no side effects. Persist the result via Supabase.
 *
 * @example
 * const grant = calculateXpGrant("like_card", { streakDays: 7, seasonMultiplier: 1.5 });
 * // → { action: "like_card", baseXp: 5, bonusXp: 4.5, totalXp: 9, bonusReason: "Streak ×1.5" }
 */
export function calculateXpGrant(
  action: XpActionType,
  opts: XpGrantOptions = {}
): XpGrant {
  const config = XP_ACTION_CONFIG[action];
  const { streakDays = 0, seasonMultiplier = 1.0, eventBonus = 0 } = opts;

  let base = config.base * config.multiplier;

  // Streak bonus — linear scale, capped at 3× for 30+ day streaks
  const streakMult = action === "streak_bonus"
    ? Math.min(1 + streakDays * 0.1, 3.0)
    : 1.0;

  const combined = base * streakMult * seasonMultiplier;
  const bonus = combined - base + eventBonus;
  const bonusReasons: string[] = [];
  if (streakMult > 1.0) bonusReasons.push(`Streak ×${streakMult.toFixed(1)}`);
  if (seasonMultiplier !== 1.0) bonusReasons.push(`Season ×${seasonMultiplier}`);
  if (eventBonus > 0) bonusReasons.push(`Event +${eventBonus}`);

  return {
    action,
    baseXp: Math.round(base),
    bonusXp: Math.round(bonus + eventBonus),
    totalXp: Math.round(combined + eventBonus),
    bonusReason: bonusReasons.join(", "),
  };
}

/**
 * Given total cumulative XP, return the current level and progress
 * using a quadratic curve: xpForLevel(n) = 100 * n^1.5
 */
export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
}

function xpThreshold(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function computeLevel(totalXp: number): LevelInfo {
  let level = 1;
  let accumulated = 0;

  while (true) {
    const needed = xpThreshold(level);
    if (accumulated + needed > totalXp) {
      return {
        level,
        currentLevelXp: accumulated,
        nextLevelXp: accumulated + needed,
        progressXp: totalXp - accumulated,
        progressPercent: Math.min(((totalXp - accumulated) / needed) * 100, 100),
      };
    }
    accumulated += needed;
    level++;
  }
}

// ─── Streak Engine ────────────────────────────────────────────────────────────

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** ISO date string of last activity (UTC date only, no time) */
  lastActivityDate: string | null;
  /** Whether today has already been counted */
  alreadyClaimedToday: boolean;
}

/**
 * Returns today's date in UTC as YYYY-MM-DD.
 * Safe to call server-side.
 */
export function utcDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Given the previous streak state and today's UTC date, return the updated
 * streak state. Call this on every daily_login action.
 *
 * Rules:
 * - Same day: no change (already claimed)
 * - Next consecutive day: streak++
 * - Gap of 1+ day: streak resets to 1
 */
export function evaluateStreak(
  prev: StreakState,
  todayUtc: string = utcDateString()
): StreakState {
  if (prev.alreadyClaimedToday && prev.lastActivityDate === todayUtc) {
    return prev; // idempotent
  }

  if (prev.lastActivityDate === null) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, prev.longestStreak),
      lastActivityDate: todayUtc,
      alreadyClaimedToday: true,
    };
  }

  const lastDate = new Date(prev.lastActivityDate + "T00:00:00Z");
  const todayDate = new Date(todayUtc + "T00:00:00Z");
  const diffDays = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    // Same day — mark claimed
    return { ...prev, alreadyClaimedToday: true };
  }

  const newStreak = diffDays === 1 ? prev.currentStreak + 1 : 1;
  return {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, prev.longestStreak),
    lastActivityDate: todayUtc,
    alreadyClaimedToday: true,
  };
}

/**
 * Milestone thresholds that award bonus XP on top of the daily streak.
 */
export const STREAK_MILESTONES: Record<number, { bonusXp: number; label: string }> = {
  3:   { bonusXp: 50,   label: "3-Day Streak" },
  7:   { bonusXp: 150,  label: "Week Warrior" },
  14:  { bonusXp: 350,  label: "Fortnight Fury" },
  30:  { bonusXp: 1000, label: "Monthly Legend" },
  100: { bonusXp: 5000, label: "Centurion" },
};

export function getStreakMilestone(
  streak: number
): { bonusXp: number; label: string } | null {
  const milestones = Object.entries(STREAK_MILESTONES)
    .map(([k, v]) => ({ threshold: Number(k), ...v }))
    .sort((a, b) => a.threshold - b.threshold);

  for (const m of milestones) {
    if (streak === m.threshold) return { bonusXp: m.bonusXp, label: m.label };
  }
  return null;
}

// ─── Achievement Engine ───────────────────────────────────────────────────────

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  /** XP rewarded on unlock */
  xpReward: number;
  /** Icon identifier (maps to component icon set) */
  icon: string;
  /** Condition type used for evaluation */
  conditionType: AchievementConditionType;
  /** Threshold value for the condition */
  conditionValue: number;
  /** Optional universe/game slug to scope the achievement */
  scopeSlug?: string;
}

export type AchievementConditionType =
  | "total_xp"
  | "streak_days"
  | "cards_liked"
  | "cards_bookmarked"
  | "universes_visited"
  | "quizzes_completed"
  | "level_reached"
  | "characters_viewed"
  | "shares_made"
  | "comments_posted";

export interface UserStats {
  totalXp: number;
  currentStreak: number;
  cardsLiked: number;
  cardsBookmarked: number;
  universesVisited: number;
  quizzesCompleted: number;
  level: number;
  charactersViewed: number;
  sharesMade: number;
  commentsPosted: number;
}

/**
 * Evaluate whether a single achievement's condition is met by the user's stats.
 * Pure function — no side effects.
 */
export function evaluateAchievement(
  achievement: Achievement,
  stats: UserStats
): boolean {
  const { conditionType, conditionValue } = achievement;
  const map: Record<AchievementConditionType, number> = {
    total_xp:           stats.totalXp,
    streak_days:        stats.currentStreak,
    cards_liked:        stats.cardsLiked,
    cards_bookmarked:   stats.cardsBookmarked,
    universes_visited:  stats.universesVisited,
    quizzes_completed:  stats.quizzesCompleted,
    level_reached:      stats.level,
    characters_viewed:  stats.charactersViewed,
    shares_made:        stats.sharesMade,
    comments_posted:    stats.commentsPosted,
  };
  return map[conditionType] >= conditionValue;
}

/**
 * Evaluate a full list of achievements against stats.
 * Returns only newly-unlocked IDs (achievements not yet in `unlockedIds`).
 *
 * Designed to run after any user action — pass the result to Supabase to
 * insert new rows into `user_achievements`.
 */
export function evaluateAllAchievements(
  achievements: Achievement[],
  stats: UserStats,
  unlockedIds: Set<string>
): Achievement[] {
  return achievements.filter(
    (a) => !unlockedIds.has(a.id) && evaluateAchievement(a, stats)
  );
}

// ─── Collectibles Metadata ────────────────────────────────────────────────────

export type CollectibleRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type CollectibleType = "card" | "badge" | "avatar_frame" | "title" | "emote" | "season_item";

export interface CollectibleMetadata {
  id: string;
  name: string;
  description: string;
  type: CollectibleType;
  rarity: CollectibleRarity;
  /** Season this was introduced (null = permanent) */
  season: number | null;
  /** ISO date when this collectible can no longer be obtained */
  expiresAt: string | null;
  /** Source: how it's obtained */
  source: "season_pass" | "achievement" | "purchase" | "event" | "drop" | "referral";
  /** Relative image path or full URL */
  imageUrl: string;
  /** Tags for filtering */
  tags: string[];
  /** Tradeable between users (future feature flag) */
  tradeable: boolean;
  /** Base market value in game currency */
  baseValue: number;
}

export interface UserCollectible {
  collectibleId: string;
  /** ISO timestamp when obtained */
  obtainedAt: string;
  /** How many instances the user has */
  quantity: number;
  /** Whether it's currently equipped / displayed */
  equipped: boolean;
}

/**
 * Check whether a collectible is still obtainable (not expired, not future).
 */
export function isCollectibleAvailable(meta: CollectibleMetadata): boolean {
  if (!meta.expiresAt) return true;
  return new Date(meta.expiresAt).getTime() > Date.now();
}

/**
 * Sort collectibles by rarity weight (mythic first).
 */
const RARITY_WEIGHT: Record<CollectibleRarity, number> = {
  mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1,
};

export function sortCollectiblesByRarity(
  items: CollectibleMetadata[]
): CollectibleMetadata[] {
  return [...items].sort(
    (a, b) => RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity]
  );
}

/**
 * Merge server collectible metadata with user-ownership records.
 * Returns an array annotated with ownership state, ready for UI rendering.
 */
export interface OwnedCollectible extends CollectibleMetadata {
  owned: boolean;
  quantity: number;
  equipped: boolean;
  obtainedAt: string | null;
}

export function mergeCollectibles(
  allMeta: CollectibleMetadata[],
  userOwned: UserCollectible[]
): OwnedCollectible[] {
  const ownedMap = new Map(userOwned.map((u) => [u.collectibleId, u]));
  return allMeta.map((meta) => {
    const owned = ownedMap.get(meta.id);
    return {
      ...meta,
      owned: !!owned,
      quantity: owned?.quantity ?? 0,
      equipped: owned?.equipped ?? false,
      obtainedAt: owned?.obtainedAt ?? null,
    };
  });
}

// ─── Supabase-ready serialisation helpers ─────────────────────────────────────
// These shapes map 1:1 to Postgres table rows — use them as insert/update payloads.

export interface XpEventRow {
  user_id: string;
  action: XpActionType;
  entity_id: string | null;
  base_xp: number;
  bonus_xp: number;
  total_xp: number;
  bonus_reason: string;
  created_at: string; // ISO
}

export function toXpEventRow(
  userId: string,
  grant: XpGrant,
  entityId: string | null = null
): XpEventRow {
  return {
    user_id: userId,
    action: grant.action,
    entity_id: entityId,
    base_xp: grant.baseXp,
    bonus_xp: grant.bonusXp,
    total_xp: grant.totalXp,
    bonus_reason: grant.bonusReason,
    created_at: new Date().toISOString(),
  };
}

export interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export function toStreakRow(userId: string, state: StreakState): StreakRow {
  return {
    user_id: userId,
    current_streak: state.currentStreak,
    longest_streak: state.longestStreak,
    last_activity_date: state.lastActivityDate,
    updated_at: new Date().toISOString(),
  };
}

export interface AchievementUnlockRow {
  user_id: string;
  achievement_id: string;
  xp_granted: number;
  unlocked_at: string;
}

export function toAchievementUnlockRows(
  userId: string,
  achievements: Achievement[]
): AchievementUnlockRow[] {
  const now = new Date().toISOString();
  return achievements.map((a) => ({
    user_id: userId,
    achievement_id: a.id,
    xp_granted: a.xpReward,
    unlocked_at: now,
  }));
}

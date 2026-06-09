// lib/gamification/achievements.ts
/**
 * Gamification Achievements Module
 * --------------------------------
 * Defines the Achievement shape and provides a static registry of all
 * possible achievements. Fields are aligned with AchievementBadge.tsx.
 */

// ─── Rarity ───────────────────────────────────────────────────────────────────

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

// ─── Achievement ──────────────────────────────────────────────────────────────

export interface Achievement {
  /** Unique identifier */
  id: string;
  /** Human-readable title */
  title: string;
  /** Description shown to the user */
  description: string;
  /** Emoji used as the badge icon */
  iconEmoji: string;
  /** Optional icon URL or SVG (legacy / future use) */
  icon?: string;
  /** Experience points awarded when the achievement is earned */
  xpReward: number;
  /** Visual rarity tier */
  rarity: AchievementRarity;
  /** Category for filtering in the grid */
  category: "engagement" | "collection" | "social" | "streak" | "exploration";
  /**
   * If true, title and icon are hidden until the achievement is unlocked.
   * Defaults to false.
   */
  secret?: boolean;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_login",
    title: "First Login",
    description: "You logged in for the first time!",
    iconEmoji: "👋",
    xpReward: 10,
    rarity: "common",
    category: "engagement",
  },
  {
    id: "streak_5",
    title: "5-Day Streak",
    description: "Visited the app five consecutive days.",
    iconEmoji: "🔥",
    xpReward: 50,
    rarity: "uncommon",
    category: "streak",
  },
  {
    id: "streak_30",
    title: "30-Day Streak",
    description: "Visited the app 30 consecutive days.",
    iconEmoji: "💎",
    xpReward: 300,
    rarity: "epic",
    category: "streak",
  },
  {
    id: "collector",
    title: "Collector",
    description: "Unlocked 10 collectibles.",
    iconEmoji: "🎖️",
    xpReward: 100,
    rarity: "rare",
    category: "collection",
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Unlocked every collectible in a single universe.",
    iconEmoji: "🏆",
    xpReward: 500,
    rarity: "legendary",
    category: "collection",
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Visited 20 different universe pages.",
    iconEmoji: "🗺️",
    xpReward: 75,
    rarity: "uncommon",
    category: "exploration",
  },
  {
    id: "social_butterfly",
    title: "Social Butterfly",
    description: "Shared content 5 times.",
    iconEmoji: "🦋",
    xpReward: 60,
    rarity: "common",
    category: "social",
  },
  {
    id: "hidden_gem",
    title: "Hidden Gem",
    description: "You found something secret…",
    iconEmoji: "💎",
    xpReward: 250,
    rarity: "rare",
    category: "exploration",
    secret: true,
  },
];

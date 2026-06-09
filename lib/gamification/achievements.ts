// lib/gamification/achievements.ts
/**
 * Gamification Achievements Module
 * --------------------------------
 * This module defines the shape of an achievement and provides a simple
 * in‑memory registry of all possible achievements. In a real app you might
 * fetch this list from a backend, but for the purpose of this demo a static
 * array is sufficient.
 */

export interface Achievement {
  /** Unique identifier */
  id: string;
  /** Human‑readable title */
  title: string;
  /** Description shown to the user */
  description: string;
  /** Optional icon URL or SVG */
  icon?: string;
  /** Experience points awarded when the achievement is earned */
  xpReward: number;
}

/**
 * Static catalogue of all achievements available in the app. Feel free to add
 * more items as the product grows.
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_login",
    title: "First Login",
    description: "You logged in for the first time!",
    xpReward: 10,
  },
  {
    id: "streak_5",
    title: "5‑Day Streak",
    description: "Visited the app five consecutive days.",
    xpReward: 50,
  },
  {
    id: "collector",
    title: "Collector",
    description: "Unlocked 10 collectibles.",
    xpReward: 100,
  },
];

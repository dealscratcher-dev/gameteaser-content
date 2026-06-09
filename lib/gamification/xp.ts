// lib/gamification/xp.ts
/**
 * Experience (XP) handling utilities.
 * XP is stored in `localStorage` under the key "gamification:xp".
 * The module defines a simple leveling curve and provides helpers to
 * add XP, retrieve current XP, and compute the user's level.
 */

export interface XPState {
  /** Total accumulated XP */
  total: number;
}

const STORAGE_KEY = "gamification:xp";

/** Load XP state from localStorage. */
export function loadXP(): XPState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as XPState;
      if (typeof parsed.total === "number" && parsed.total >= 0) {
        return parsed;
      }
    } catch {}
  }
  return { total: 0 };
}

/** Save XP state to localStorage. */
export function saveXP(state: XPState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** XP thresholds for each level (cumulative). */
export const LEVEL_THRESHOLDS: number[] = [
  0, // level 0 (no XP)
  100, // level 1
  250, // level 2
  450, // level 3
  700, // level 4
  1000, // level 5
  1350, // level 6
  1750, // level 7
  2200, // level 8
  2700, // level 9
  3250, // level 10
];

/** Return the current level based on total XP. */
export function getLevel(totalXP: number = loadXP().total): number {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/** Add XP and return the new total and level. */
export function addXP(amount: number): { total: number; level: number } {
  if (amount <= 0) return { total: loadXP().total, level: getLevel() };
  const state = loadXP();
  state.total += amount;
  saveXP(state);
  return { total: state.total, level: getLevel(state.total) };
}

/** Helper to get the XP required to reach the next level. */
export function xpToNextLevel(currentXP: number = loadXP().total): number {
  const currentLevel = getLevel(currentXP);
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel + 1];
  if (nextThreshold === undefined) return 0; // max level reached
  return nextThreshold - currentXP;
}

/**
 * Gamification XP Library
 * -----------------------
 * Provides helpers to add experience points (XP), compute the user level,
 * and retrieve the current XP value. Data is persisted in `localStorage`
 * under the key `user_xp`.
 */

/** XP required for each level – simple exponential curve */
const XP_PER_LEVEL = (lvl: number): number => 100 * Math.pow(1.5, lvl - 1);

/** Retrieve stored XP (defaults to 0) */
function getStoredXp(): number {
  try {
    const raw = localStorage.getItem('user_xp');
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/** Persist XP value */
function setStoredXp(xp: number) {
  localStorage.setItem('user_xp', String(Math.max(0, Math.floor(xp))));
}

/** Add XP and return the new total */
export function addXp(amount: number): number {
  const current = getStoredXp();
  const next = current + Math.max(0, Math.floor(amount));
  setStoredXp(next);
  return next;
}

/** Get the current XP */
export function getXp(): number {
  return getStoredXp();
}

/** Compute the current level based on stored XP */
export function getLevel(): number {
  let xp = getStoredXp();
  let level = 1;
  while (xp >= XP_PER_LEVEL(level)) {
    xp -= XP_PER_LEVEL(level);
    level++;
  }
  return level;
}

/** XP needed to reach the next level */
export function xpToNextLevel(): number {
  const level = getLevel();
  const currentXp = getStoredXp();
  const cumulative = [...Array(level).keys()].reduce((sum, i) => sum + XP_PER_LEVEL(i + 1), 0);
  return XP_PER_LEVEL(level) - (currentXp - cumulative);
}

/** Helper that returns both XP and level */
export function getXpStatus(): { xp: number; level: number; xpNext: number } {
  const xp = getStoredXp();
  const level = getLevel();
  const xpNext = xpToNextLevel();
  return { xp, level, xpNext };
}

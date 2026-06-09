/**
 * Gamification Collectibles Library
 * --------------------------------
 * Defines collectible items, their unlocking conditions, and helper functions
 * to manage user progress. All data is persisted in `localStorage` under the
 * key `user_collectibles`.
 */

export type Collectible = {
  id: string;
  name: string;
  description: string;
  icon: string; // URL or base64 data URI for UI rendering
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

/** Default collectible catalogue – extend as needed */
export const ALL_COLLECTIBLES: Record<string, Collectible> = {
  first_like: {
    id: 'first_like',
    name: 'First Like',
    description: 'Awarded for giving your first like.',
    icon: '/icons/like.svg',
    rarity: 'common',
  },
  streak_5: {
    id: 'streak_5',
    name: '5‑Day Streak',
    description: 'Maintain a 5‑day engagement streak.',
    icon: '/icons/streak5.svg',
    rarity: 'rare',
  },
  // Add more collectibles here
};

/** Retrieve the list of unlocked IDs from storage */
function getUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem('user_collectibles');
    const arr = raw ? JSON.parse(raw) : [];
    return new Set<string>(arr);
  } catch {
    return new Set();
  }
}

/** Persist the unlocked set */
function setUnlocked(set: Set<string>) {
  localStorage.setItem('user_collectibles', JSON.stringify(Array.from(set)));
}

/** Unlock a collectible for the current user */
export function unlockCollectible(id: string): boolean {
  const catalog = ALL_COLLECTIBLES[id];
  if (!catalog) return false;
  const unlocked = getUnlocked();
  if (unlocked.has(id)) return false; // already unlocked
  unlocked.add(id);
  setUnlocked(unlocked);
  return true;
}

/** Check if a collectible is unlocked */
export function isCollectibleUnlocked(id: string): boolean {
  return getUnlocked().has(id);
}

/** Get all unlocked collectible objects */
export function getUnlockedCollectibles(): Collectible[] {
  const unlocked = getUnlocked();
  return Array.from(unlocked)
    .map((id) => ALL_COLLECTIBLES[id])
    .filter(Boolean);
}

/**
 * Gamification Collectibles
 * --------------------------
 * This module defines collectible items that a user can earn while using the app.
 * Each collectible has an `id`, a human‑readable `name`, an optional `description`
 * and a `icon` URL that can be used in the UI. The `unlockCollectible` function
 * persists the unlocked state using `localStorage` so that it survives page reloads.
 */

export interface Collectible {
  /** Unique identifier for the collectible */
  id: string;
  /** Display name */
  name: string;
  /** Optional detailed description */
  description?: string;
  /** URL to an icon or image */
  icon?: string;
}

/** Pre‑defined collectibles that the app can award */
export const COLLECTIBLES: Record<string, Collectible> = {
  firstStreak: {
    id: 'firstStreak',
    name: 'First Streak',
    description: 'Earned when you start a streak of actions.',
    icon: '/assets/collectibles/first-streak.svg',
  },
  hundredLikes: {
    id: 'hundredLikes',
    name: 'Hundred Likes',
    description: 'Earned after receiving 100 likes on your content.',
    icon: '/assets/collectibles/hundred-likes.svg',
  },
  seasonalChampion: {
    id: 'seasonalChampion',
    name: 'Seasonal Champion',
    description: 'Awarded for topping the leaderboard in a season.',
    icon: '/assets/collectibles/seasonal-champion.svg',
  },
};

/**
 * Unlock a collectible for the current user.
 * The unlocked ids are stored as a JSON‑encoded array under the key
 * `gamification:collectibles` in `localStorage`.
 */
export function unlockCollectible(id: string): void {
  const key = 'gamification:collectibles';
  const raw = localStorage.getItem(key);
  const unlocked: Set<string> = raw ? new Set(JSON.parse(raw)) : new Set();
  if (!COLLECTIBLES[id]) {
    console.warn(`Collectible with id "${id}" does not exist.`);
    return;
  }
  unlocked.add(id);
  localStorage.setItem(key, JSON.stringify(Array.from(unlocked)));
}

/** Retrieve the list of unlocked collectible ids. */
export function getUnlockedCollectibles(): string[] {
  const raw = localStorage.getItem('gamification:collectibles');
  return raw ? JSON.parse(raw) : [];
}

/** Check whether a specific collectible is already unlocked. */
export function isCollectibleUnlocked(id: string): boolean {
  return getUnlockedCollectibles().includes(id);
}
